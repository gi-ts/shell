/// <reference lib="ES2019" />

// @ts-check

const fs = require('fs');
const crypto = require('crypto');
const semver = require('semver');

const versionMap = new Map();

const LICENSE = `Copyright © 2020 Evan Welsh

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
`;

const createREADME = (name, api_version, package_version, npm_version) => {
    return `# ${name} ${api_version}

TypeScript definitions for ${name}. Generated from version ${package_version}.

Generated with [gi.ts](https://gitlab.gnome.org/ewlsh/gi.ts) and tracked in [packages.gi.ts](https://gitlab.gnome.org/ewlsh/packages.gi.ts).
`
};

async function latestVersion(name, majorVersion) {
    const versions = versionMap.get(name);

    if (!versions) {
        console.error(`No versions for ${name}`);

        const pkg = await getCurrentPackage(`${prefix}/${name.toLowerCase()}`);

        if (pkg) {
            return pkg.version;
        }

        return null;
    }

    return versions[majorVersion];
}

function packageVersion(meta, revision) {
    const rawVersion = meta.package_version || meta.api_version;
    const sem = semver.parse(rawVersion) || semver.coerce(rawVersion);

    if (!sem) {
        throw new Error(`Invalid raw version: ${rawVersion} for ${meta.name}`);
    }

    sem.patch = revision;

    if (sem.minor >= 90) {
        return `${sem.format()}-prerelease`;
    }

    return `${sem.format()}`;
}

const prefix = '@gi-types';

const NpmApi = require('npm-api');
const npm = new NpmApi();

async function getCurrentPackage(name) {
    let repo = npm.repo(name);

    if (repo) {
        try {
            let pkg = await repo.version('latest');

            return pkg;
        } catch (err) {
            console.log(err)
        }
    }
    return null;
}

/**
 * @param {*} meta 
 * @param {string} version 
 * @param {string} hash 
 * @param {string} gitHead
 * @param {string} tag 
 * @param {boolean} [hasOverride]
 * @param {boolean} [private] 
 * @param {boolean} [downgrade]
 */
async function buildPackageJSON(meta, version, hash, gitHead, tag, hasOverride = false, private = false, downgrade = false) {
    const pkg = await getCurrentPackage(`${prefix}/${meta.name.toLowerCase()}`);

    if (pkg !== null) {
        version = pkg.version;
    }

    const [dependencies, peerDependencies] = (await Promise.all(Object.entries(meta.imports).map(async ([im, api_version]) => {
        const version = await latestVersion(im, api_version);

        if (version)
            return [`${prefix}/${im.toLowerCase()}`, `^${version}`];
        else
            return [`${prefix}/${im.toLowerCase()}`, `*`];
    }))).reduce(([dependencies, peerDependencies], [a, b]) => {
        if (b === '*') {
            peerDependencies.push([a, b])
        } else {
            dependencies.push([a, b])
        }

        return [dependencies, peerDependencies];
    }, [[], []]).map(list => list.length > 0 ? Object.fromEntries(list.sort(([a], [b]) => a.localeCompare(b))) : null);

    return {
        "name": `${prefix}/${meta.name.toLowerCase()}`,
        ...(private ? { "private": true } : {
            "publishConfig": {
                "access": "public",
                "tag": tag
            }
        }),
        "version": `${version}`,
        "description": `TypeScript definitions for ${meta.name}`,
        "license": "MIT",
        "contributors": [
            {
                "name": "Evan Welsh",
                "url": "https://gitlab.gnome.org/ewlsh/",
                "githubUsername": "ewlsh"
            }
        ],
        "main": "",
        "files": [
            "index.d.ts",
            ...(hasOverride ? ["override.d.ts"] : []),
            "doc.json",
            "package.json",
            ...(private ? [] : ["README.md", "LICENSE"]),
            ...(!downgrade ? [] : ["ts4.1/override.d.ts"]),
        ],
        "types": hasOverride ? "override.d.ts" : "index.d.ts",
        ...(downgrade ? {
            "typesVersions": {
                ">=4.1": {
                    "*": [
                        "ts4.1/*"
                    ]
                }
            }
        } : {}),
        "repository": {
            "type": "git",
            "url": "https://gitlab.gnome.org/ewlsh/packages.gi.ts.git",
            "directory": `packages/${meta.slug}`
        },
        "scripts": {},
        "contentHash": hash,
        ...(dependencies ? {
            "dependencies":
            {
                ...dependencies
            }
        } : {}),
        ...(peerDependencies ? {
            "peerDependencies":
            {
                ...peerDependencies
            }
        } : {}),
        "typeScriptVersion": "4.1",
        "gitHead": gitHead
    };
}

/**
 * @param {string} dir 
 */
function getDirectories(dir) {
    return fs.readdirSync(dir, {
        withFileTypes: true
    })
        .filter(child => child.isDirectory())
        .map(child => child.name);
}

/**
 * @param {string} file 
 */
function fileHash(file) {
    return crypto.createHash('md5').update(file).digest('hex');
}

/**
 * @param {string} directory 
 * @param {string[] | null} [includeList] 
 */
function generatePackages(directory, includeList = null) {
    console.log(`Generating packages for ${directory}.`);

    const packages = getDirectories(directory);

    return packages.map(package => {
        const meta = JSON.parse(fs.readFileSync(`${directory}/${package}/doc.json`, {
            encoding: 'utf-8'
        }));

        const typeFile = fs.readFileSync(`${directory}/${package}/index.d.ts`, {
            encoding: 'utf-8'
        });

        const overrideExists = fs.existsSync(`${directory}/${package}/override.d.ts`);
        const downgrade = fs.existsSync(`${directory}/${package}/ts4.1/override.d.ts`);

        let generatedSourceHash = fileHash(typeFile);

        let currentPackageVersion = null;
        let currentSourceHash = null;
        let gitHead = null;

        let version = packageVersion(meta, 0);

        try {
            let packagejson = JSON.parse(fs.readFileSync(`${directory}/${package}/package.json`, {
                encoding: 'utf-8'
            }));

            currentSourceHash = packagejson["contentHash"];
            currentPackageVersion = packagejson["version"];
            gitHead = packagejson["gitHead"];

            if (currentPackageVersion) {
                const sem = semver.parse(currentPackageVersion);
                version = packageVersion(meta, sem.patch + 1);
            }
        } catch (err) { }

        if (currentPackageVersion && currentSourceHash === generatedSourceHash) {
            version = currentPackageVersion;
        }

        meta.slug = package;

        const isPrivate = includeList && !includeList.includes(meta.name);

        if (!isPrivate) {
            const versions = versionMap.get(meta.name) || {};

            versions[meta.api_version] = version;

            versionMap.set(meta.name, versions);
        }

        return { isPrivate, directory, package, hash: generatedSourceHash, overrideExists, downgrade, gitHead, version, meta };
    });
}

/**
 * @param {ReturnType<typeof generatePackages>} packages 
 * @param {string} tag 
 */
function printPackages(packages, tag) {
    return Promise.all(packages.map(async ({ isPrivate, directory, package, hash, overrideExists, downgrade, gitHead, version, meta }) => {
        if (!isPrivate) {
            const json = await buildPackageJSON(
                meta,
                version,
                hash,
                gitHead,
                tag,
                overrideExists,
                isPrivate,
                downgrade
            );

            const README = createREADME(meta.name, meta.api_version, meta.package_version, version);

            fs.writeFileSync(`${directory}/${package}/package.json`, `${JSON.stringify(json, null, 4)}\n`);


            fs.writeFileSync(`${directory}/${package}/LICENSE`, `${LICENSE}`);
            fs.writeFileSync(`${directory}/${package}/README.md`, `${README}`);
        }
    }));
}



const base = generatePackages("./packages");

printPackages(base, "latest").then(() => {
    console.log(versionMap);
});

