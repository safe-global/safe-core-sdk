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

type NpmPublishOutput = Record<
  string,
  PackagePublishInfo & {
    files?: string[]
    bundled?: unknown[]
  }
>

const executeCommand = (command: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
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

    const stdout = await executeCommand('npm', [
      'publish',
      '--access',
      'public',
      '--dry-run',
      '--workspaces',
      '--json',
      '--ignore-scripts'
    ])

    let jsonOutput: NpmPublishOutput
    try {
      jsonOutput = JSON.parse(stdout) as NpmPublishOutput
    } catch (parseError) {
      throw new Error(`Error parsing JSON output: ${(parseError as Error).message}`)
    }

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
