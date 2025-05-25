const { task, series } = require("gulp");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const RELEASE_NEXT = "next";

function createNextRelease(callback) {
  // create a release called "next" and update the *.vsix file as release asset into github releases

  // check if there is a vsix file in the current directory
  const vsixFile = fs
    .readdirSync(process.cwd())
    .find((file) => file.endsWith(".vsix"));
  if (!vsixFile) {
    console.error("No .vsix file found in the current directory.");
    return callback(new Error("No .vsix file found"));
  }

  // create a new github release called "next" with the vsix file as asset and tag it as "next"
  const releaseName = RELEASE_NEXT;
  const releaseTag = RELEASE_NEXT;
  const releaseDescription = `Next release on ${new Date().toISOString()}`;
  const command = `gh release create ${releaseTag} ${vsixFile} --title "${releaseName}" --notes "${releaseDescription}" --prerelease`;
  try {
    execSync(command, { stdio: "inherit" });
    console.log(
      `Release ${releaseName} created successfully with tag ${releaseTag}.`,
    );
    callback();
  } catch (error) {
    console.error(`Failed to create release: ${error.message}`);
    return callback(error);
  }
}

function deleteNextRelease(callback) {
  // check if the next release exists
  const releaseTag = RELEASE_NEXT;
  try {
    execSync(`gh release view ${releaseTag}`, { stdio: "ignore" });

    try {
      // delete the assets attached to the release
      const assets = execSync(
        `gh release view ${releaseTag} --json assets --jq '.assets[].name'`,
        { encoding: "utf-8" },
      )
        .split("\n")
        .filter((asset) => asset.trim() !== "");
      if (assets.length > 0) {
        assets.forEach((asset) => {
          execSync(`gh release delete-asset ${releaseTag} "${asset}" --yes`, {
            stdio: "inherit",
          });
        });
      }

      // delete the release itself
      execSync(`gh release delete ${releaseTag} --yes --cleanup-tag`, {
        stdio: "inherit",
      });
      callback();
    } catch (error) {
      console.error(`Failed to delete release : ${error.message}`);
      return callback(error);
    }
  } catch (error) {
    console.info("Next release does not exist, nothing to delete.");
    callback();
  }
}

function checkGithubCli(callback) {
  try {
    execSync("gh --version", { stdio: "ignore" });
    callback();
  } catch (error) {
    callback(
      new Error(
        "GitHub CLI (gh) is not installed. Please install it to use this task.",
      ),
    );
  }
}

function checkGithubToken(callback) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    callback(
      new Error(
        "GITHUB_TOKEN environment variable is not set. Please set it to use this task.",
      ),
    );
  } else {
    callback();
  }
}

const nextCreate = series(checkGithubCli, checkGithubToken, createNextRelease);
task("create-release-next", nextCreate);

const nextDelete = series(checkGithubCli, checkGithubToken, deleteNextRelease);
task("delete-release-next", nextDelete);
