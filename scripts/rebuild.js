const fs = require("fs").promises
const path = require("path")
const { exec } = require("child_process")

async function removeDir(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true })
    console.log(`Successfully deleted ${dir}`)
  } catch (err) {
    console.error(`Error while deleting ${dir}.`, err)
  }
}

async function rebuild() {
  const nextDir = path.join(__dirname, "..", ".next")

  console.log("Clearing .next folder...")
  await removeDir(nextDir)

  console.log("Running Next.js build...")
  exec("npm run build", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during build: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Build stderr: ${stderr}`)
      return
    }
    console.log(`Build stdout: ${stdout}`)
    console.log("Rebuild completed successfully!")
  })
}

rebuild()

