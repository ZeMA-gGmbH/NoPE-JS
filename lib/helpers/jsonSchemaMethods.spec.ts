/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { assert } from "chai";
import { describe, it } from "mocha";
import { INopeDescriptor } from "../index.browser";
import { isJsonSchema } from "./jsonSchemaMethods";

describe("jsonSchemaMethods", function () {
  // Describe the required Test:

  const tests: [string, INopeDescriptor, boolean][] = [
    [
      "function",
      {
        type: "function",
        inputs: [
          {
            name: "parameter",
            schema: {
              type: "string",
            },
          },
        ],
      },
      false,
    ],
    [
      "nested-function",
      {
        type: "object",
        properties: {
          function: {
            type: "function",
            inputs: [],
          },
        },
      },
      false,
    ],
    [
      "array => items",
      {
        $id: "https://example.com/arrays.schema.json",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        description:
          "A representation of a person, company, organization, or place",
        type: "object",
        properties: {
          fruits: {
            type: "array",
            items: {
              type: "function",
            },
          },
          vegetables: {
            type: "array",
            items: { $ref: "#/$defs/veggie" },
          },
        },
      },
      false,
    ],
    [
      "array => additionalItems",
      {
        $id: "https://example.com/arrays.schema.json",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        description:
          "A representation of a person, company, organization, or place",
        type: "object",
        properties: {
          fruits: {
            type: "array",
            items: {
              type: "string",
            },
            additionalItems: {
              type: "function",
            },
          },
          vegetables: {
            type: "array",
            items: { $ref: "#/$defs/veggie" },
          },
        },
      },
      false,
    ],
    [
      "anyOf",
      {
        $id: "https://example.com/arrays.schema.json",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        description:
          "A representation of a person, company, organization, or place",
        type: "object",
        properties: {
          fruits: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        anyOf: [
          {
            type: "string",
          },
          {
            type: "function",
          },
        ],
      },
      false,
    ],
    [
      "allOf",
      {
        $id: "https://example.com/arrays.schema.json",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        description:
          "A representation of a person, company, organization, or place",
        type: "object",
        properties: {
          fruits: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        allOf: [
          {
            type: "function",
          },
        ],
      },
      false,
    ],
    [
      "oneOf",
      {
        $id: "https://example.com/arrays.schema.json",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        description:
          "A representation of a person, company, organization, or place",
        type: "object",
        properties: {
          fruits: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        oneOf: [
          {
            type: "function",
          },
        ],
      },
      false,
    ],
  ];

  describe("isJsonSchema", function () {
    for (const [name, test, expectedResult] of tests) {
      it(name, function () {
        const result = isJsonSchema(test);
        assert.isTrue(result == expectedResult, "Test Failed");
      });
    }

    it("detect-nope-schema -> true", function () {
      const shouldFalse: INopeDescriptor[] = [
        {
          $id: "https://example.com/person.schema.json",
          $schema: "https://json-schema.org/draft/2020-12/schema",
          title: "Person",
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "The person's first name.",
            },
            lastName: {
              type: "string",
              description: "The person's last name.",
            },
            age: {
              description:
                "Age in years which must be equal to or greater than zero.",
              type: "integer",
              minimum: 0,
            },
          },
        },
        {
          $id: "https://example.com/geographical-location.schema.json",
          $schema: "https://json-schema.org/draft/2020-12/schema",
          title: "Longitude and Latitude Values",
          description: "A geographical coordinate.",
          required: ["latitude", "longitude"],
          type: "object",
          properties: {
            latitude: {
              type: "number",
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              minimum: -180,
              maximum: 180,
            },
          },
        },
        {
          $id: "https://example.com/arrays.schema.json",
          $schema: "https://json-schema.org/draft/2020-12/schema",
          description:
            "A representation of a person, company, organization, or place",
          type: "object",
          properties: {
            fruits: {
              type: "array",
              items: {
                type: "string",
              },
            },
            vegetables: {
              type: "array",
              items: { $ref: "#/$defs/veggie" },
            },
          },
          definitions: {
            veggie: {
              type: "object",
              required: ["veggieName", "veggieLike"],
              properties: {
                veggieName: {
                  type: "string",
                  description: "The name of the vegetable.",
                },
                veggieLike: {
                  type: "boolean",
                  description: "Do I like this vegetable?",
                },
              },
            },
          },
        },
      ];

      for (const test of shouldFalse) {
        const result = isJsonSchema(test);
        assert.isTrue(result, "Test should be true");
      }
    });
  });
});
