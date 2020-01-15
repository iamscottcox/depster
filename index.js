const fs = require("fs");
const path = require("path");
const [nodePath, filePath, depName, newVersion] = process.argv;

const { DEPENDENCIES, DEV_DEPENDENCIES } = require("./constants");

const reposPath = path.resolve(__dirname, "repos");

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

if (depName === undefined) {
  console.error("You have not provided the name of the dependency.");
  process.exit();
}

if (newVersion === undefined) {
  console.error("You have not specified the new version number");
  process.exit();
}

fs.readdir(reposPath, (err, projects) => {
  if (err) {
    console.err("There were no projects in the repos/ directory");
  }

  projects.forEach(projectName => {
    const projectPath = path.resolve(reposPath, projectName);
    fs.readdir(projectPath, err => {
      if (err) {
        console.error(`There are no files in ${projectName}`);
        console.error("Skipping...");
      }

      const jsonPath = path.resolve(projectPath, "package.json");
      const rawData = fs.readFileSync(jsonPath);
      const data = JSON.parse(rawData);
      const { dependencies, devDependencies, name } = data;

      if (name === depName) {
        return;
      }

      const depType = getDependencyType(depName, data);

      if (depType === undefined) {
        return;
      }

      data[depType][depName] = newVersion;

      fs.writeFile(jsonPath, data, err => {
        console.error(err);
      });
    });
  });
});
