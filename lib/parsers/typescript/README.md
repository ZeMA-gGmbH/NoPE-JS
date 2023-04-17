## Table of Content
- [Description](#description)
  - [Generated Files.](#generated-files)

# Description
This Parser translates a description into a `typescript`-class, which can then be used as wrapper to access a remote Tool. This is espacially useful if you consider using modules of different languages like `python` inside of your `typescript` code.

## Generated Files.
The parser creates the following items: 
- `interfaces` for accessing the module via a generic-module
- an `extended` **Generic-Nope-Module** for simpler access
- optionally an **access-class** which contains all accessors and a Nope-Dispatcher