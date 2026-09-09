import { execFile } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

type PackagePublishInfo = {
  id: string
  name: string
  version: string
  size: number
  unpackedSize: number
  shasum: string
  integrity: string
  filename: string
  entryCount: number
}

// `pnpm publish --json` includes these extra fields we don't want to persist.
type PublishDryRunOutput = PackagePublishInfo & {
  files?: string[]
  bundled?: unknown[]
}

type NpmPublishOutput = Record<string, PublishDryRunOutput>

type WorkspacePackage = {
  name: string
  version: string
  path: string
  private?: boolean
}

const executeCommand = (
  command: string,
  args: string[],
  cwd?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(`Error executing command: ${error.message}`)
      }

      if (stderr) {
        console.warn(`Warning during execution: ${stderr}`)
      }

      resolve(stdout)
    })
  })
}

// List the publishable (non-private) workspace packages.
const listWorkspacePackages = async (): Promise<WorkspacePackage[]> => {
  const stdout = await executeCommand('pnpm', ['-r', 'ls', '--depth', '-1', '--json'])
  const packages = JSON.parse(stdout) as WorkspacePackage[]

  return packages.filter((pkg) => !pkg.private)
}

// Run `pnpm publish --dry-run` for a single package. Unlike `npm publish`, pnpm
// rewrites the `workspace:` protocol to the pinned version, so the resulting
// tarball (and therefore its shasum/integrity) matches what `pnpm publish` will
// actually upload to the registry.
const getPackagePublishInfo = async (pkg: WorkspacePackage): Promise<PublishDryRunOutput> => {
  const stdout = await executeCommand(
    'pnpm',
    ['publish', '--dry-run', '--json', '--no-git-checks', '--ignore-scripts'],
    pkg.path
  )

  return JSON.parse(stdout) as PublishDryRunOutput
}

const writeToFile = (filePath: string, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const safeDir = path.join(process.cwd(), 'publish-info')

    fs.mkdir(safeDir, { recursive: true, mode: 0o700 }, (err) => {
      if (err) return reject(`Directory creation failed: ${err.message}`)

      const fullPath = path.join(safeDir, path.basename(filePath))

      fs.writeFile(fullPath, data, { mode: 0o600 }, (writeErr) => {
        if (writeErr) return reject(`File write failed: ${writeErr.message}`)
        resolve()
      })
    })
  })
}

const sanitizePublishOutput = (jsonData: NpmPublishOutput): Record<string, PackagePublishInfo> => {
  return Object.fromEntries(
    Object.entries(jsonData).map(([pkgName, pkgData]) => {
      const { files, bundled, ...cleanData } = pkgData

      return [pkgName, cleanData]
    })
  )
}

const getReadableFilename = (): string => {
  try {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const datePart = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-')
    const timePart = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('-')
    const timestamp = `${datePart}_${timePart}`

    return `publish-info_${timestamp}.yml`
  } catch {
    return `publish-info_${Date.now()}.yml`
  }
}

const main = async () => {
  try {
    const projectRoot = path.join(__dirname, '../')
    process.chdir(projectRoot)

    const packages = await listWorkspacePackages()

    // Resolve each package independently so `workspace:` specifiers are pinned,
    // then key the results by package name (sorted for a deterministic output).
    const entries = await Promise.all(
      packages
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async (pkg): Promise<[string, PublishDryRunOutput]> => {
          const info = await getPackagePublishInfo(pkg)
          return [pkg.name, info]
        })
    )

    const jsonOutput: NpmPublishOutput = Object.fromEntries(entries)

    const cleanedOutput = sanitizePublishOutput(jsonOutput)
    const yamlOutput = yaml.stringify(cleanedOutput)

    const outputFileName = getReadableFilename()
    await writeToFile(outputFileName, yamlOutput)

    console.log(`Output stored in ${outputFileName}`)
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

main()
