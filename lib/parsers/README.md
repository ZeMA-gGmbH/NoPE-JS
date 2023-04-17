## Table of Content
- [Parsers](#parsers)
  - [Parsing Nope-Modules](#parsing-nope-modules)
  - [Structur of a Parser](#structur-of-a-parser)

# Parsers
This folders contains parsers. This Parsers can be used to generate accessors for NopeModules in different Languages.

## Parsing Nope-Modules

Before parsing could be applied, a **description** of the modules must be provided. This descritption, can than be used to generate accessors for NopeModules in different Languages. How to write such an **description** is detailed under `/lib/modules`.

To use a Parser a `cli`-tool is provided under `/lib/cli`. Additionally you will find a UI-Kit in `/resources`

## Structur of a Parser

To parse a **description** the provided parsers, utilizes [`handlebar`-template](https://handlebarsjs.com/) to parse the description into accessor classes.



