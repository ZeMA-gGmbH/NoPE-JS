## Table of Content
- [Description](#description)
  - [OpenAPI](#openapi)
  - [Limitations](#limitations)
  - [Generated Files.](#generated-files)
  - [Implementaiton](#implementaiton)

# Description
This Parser translates a description into an `Open-API`-accessor, which can then be used as default `REST`-API of the Nope-Module. This is espacially useful if you consider using modules in other applications. 

## OpenAPI
Open-API is a broadly adopted industry standard for describing modern APIs. You can read the full specification here: http://spec.openapis.org/oas/v3.0.3

Taken from openapis.org:
> The goal of the OAI specification is to define a standard, language-agnostic interface to REST APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection. When properly defined, a consumer can understand and interact with the remote service with a minimal amount of implementation logic. Similar to what interfaces have done for lower-level programming

## Limitations
Based on the Structure of the `REST`-protocol, functions and services which uses callbacks as parameters can not be parsed to an Open-API-accessor. They will be skipped.

## Generated Files.
The parser creates the following items: 
- an `accessor`-class for Open-API

## Implementaiton

The Nope-`Open-API` Hoster heavily uses `express-openapi`. For Details checkout the following page: https://www.npmjs.com/package/express-openapi