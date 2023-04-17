# Install VS Code Extensions:

1. Open a `cmd` and install perform:

```
code --install-extension oouo-diogo-perdigao.docthis
code --install-extension edwardhjp.vscode-author-generator
```

# Configure Extensions:

## vscode-author-generator:

- Copy the `.vscode\ts.tpl` to `%USERPROFILE%\.vscode\extensions\{edwardhjp.vscode-author-generator-version}` (Replace {edwardhjp.vscode-author-generator-version} with the currently installed version)

## User Settings.json

- open the User-Settings Json
- add the following (Adapt your name and mail):

```json
{
  "author-generator.author": "Forename Surename", // <-- Edit here
  "author-generator.email": "mail", // <-- Edit here
  "author-generator.updateOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
```
