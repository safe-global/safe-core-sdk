import { exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

const executeCommand = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
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
    fs.writeFile(filePath, data, (err) => {
      if (err) {
        return reject(`Error writing file: ${err.message}`)
      }

      resolve()
    })
  })
}

const removeFilesProperty = (jsonData) => {
  for (const pkg in jsonData) {
    if (jsonData[pkg].hasOwnProperty('files')) {
      delete jsonData[pkg].files
    }
  }

  return jsonData
}

const main = async () => {
  try {
    const projectRoot = path.join(__dirname, '../')
    process.chdir(projectRoot)

    const command = 'npm publish --access public --dry-run --workspaces --json'
    const stdout = await executeCommand(command)

    let jsonOutput
    try {
      jsonOutput = JSON.parse(stdout)
    } catch (parseError) {
      throw new Error(`Error parsing JSON output: ${parseError.message}`)
    }

    const cleanedJsonOutput = removeFilesProperty(jsonOutput)
    const yamlOutput = yaml.stringify(cleanedJsonOutput)

    const outputFilePath = 'publish-info.yml'
    await writeToFile(outputFilePath, yamlOutput)

    console.log(`Output stored in ${outputFilePath}`)
  } catch (error) {
    console.error(`Error: ${error}`)
  }
}

main()
