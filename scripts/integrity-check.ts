import { exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

try {
  const projectRoot = path.join(__dirname, '../')

  process.chdir(projectRoot)

  exec('npm publish --access public --dry-run --workspaces --json', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el comando: ${error.message}`)
      return
    }

    if (stderr) {
      console.warn(`Advertencias durante la ejecución: ${stderr}`)
    }

    try {
      const jsonOutput = JSON.parse(stdout)

      for (const pkg in jsonOutput) {
        if (jsonOutput[pkg].hasOwnProperty('files')) {
          delete jsonOutput[pkg].files
        }
      }

      const yamlOutput = yaml.stringify(jsonOutput)

      fs.writeFile('publish-info.yaml', yamlOutput, (err) => {
        if (err) {
          console.error(`Error writing file: ${err.message}`)
        } else {
          console.log('Output stored in output.yaml')
        }
      })
    } catch (parseError) {
      console.error(`Error parsing JSON output: ${parseError.message}`)
    }
  })
} catch (error) {
  console.error(`Error: ${error.message}`)
}
