## release-pkg

- release your package easily!

### config file

- install 
```bash
npm install release-pkg -D 
```

- config options

```javascript
module.exports = {
  releaseBranch: ['master', 'main'], // which git branch can be released
  releaseUser: ['pengbo-study'], // who can publish this pkg
  release: true, // auto publish or not
  scripts: {
    build: 'build', // if exist, run build command
    changelog: 'changelog', //if exist, run changelog command
  },
  tag: true // need git tag?
}
```

- package.json
```json
"script": {
  "build": "tsc", 
  "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s",
  "release": "release-pkg"
}
```