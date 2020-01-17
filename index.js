#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const isEqual = require("lodash.isequal");
const inquirer = require("inquirer");
const { exec, execSync } = require("child_process");
const [nodePath, filePath, command, ...rest] = process.argv;

const { DEPENDENCIES, DEV_DEPENDENCIES } = require("./constants");

/*** UTILS ***/
// Getting the dependency type
const getDependencyType = (depName, packageJSONData) => {
  if (
    packageJSONData.dependencies &&
    packageJSONData.dependencies[depName] !== undefined
  ) {
    return DEPENDENCIES;
  }

  if (
    packageJSONData.devDependencies !== undefined &&
    packageJSONData.devDependencies[depName] !== undefined
  ) {
    return DEV_DEPENDENCIES;
  }

  return undefined;
};

// Getting Versions
const createPackageMap = () =>
  fs.readdirSync(reposPath).reduce((prev, repoName) => {
    const repoPath = path.resolve(reposPath, repoName);
    const jsonPath = path.resolve(repoPath, "package.json");
    const rawData = fs.readFileSync(jsonPath);
    const { name, version } = JSON.parse(rawData);

    prev[name] = version;

    return prev;
  }, {});

// Write to JSON file

/*** COMMANDS ***/
const update = () => {
  console.log("Working...");
  let changesMade = false;

  fs.readdirSync(reposPath).forEach(repoName => {
    // Iterate over all packages
    const packageMap = createPackageMap();
    const packageNames = Object.keys(packageMap);
    const repoPath = path.resolve(reposPath, repoName);
    const jsonPath = path.resolve(repoPath, "package.json");
    const rawData = fs.readFileSync(jsonPath);
    const data = JSON.parse(rawData);

    let shouldInstall = false;

    packageNames.forEach(packageName => {
      // Check to see if this repo has that package as a dependency
      const depType = getDependencyType(packageName, data);
      // Skip if it doesn't
      if (depType === undefined) {
        return;
      }

      const currentVersion = data[depType][packageName];
      const newVersion = `^${packageMap[packageName]}`;

      if (currentVersion === newVersion) {
        return;
      }

      changesMade = true;
      shouldInstall = true;

      // Inform the user of the changing happening to the package.json
      console.log(
        `${repoName}: ${packageName}: ${currentVersion} --> ${newVersion}`
      );
      // Make the change to the JSON object
      data[depType][packageName] = newVersion;
    });

    if (shouldInstall === true) {
      // Write the new changes to the package.json file
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
      // Run npm install in the repo
      exec(`npm --prefix ${repoPath} install ${repoPath}`, err => {
        if (err === null) {
          // Console.log a message to inform the user that changes were made to the repo and that they need to be committed
          console.log(`${repoName}: SUCCESS!! Don't forget to commit!`);
        } else {
          console.error(
            `Something went wrong when installing dependencies in ${repoName}. Skipping...`
          );
          console.error(err);
        }
      });
    }
  });
  if (changesMade === false) {
    console.log("No changes need to be made.");
    console.log("Exiting...");
  }
};

const version = () => {};

/*************** RUN THE CODE ***************/

const reposPath = path.resolve(process.cwd(), "repos");

switch (command) {
  case "update":
    return update();
  default:
    console.error(`Command "${command}" not recognised`);
    return process.exit();
}
