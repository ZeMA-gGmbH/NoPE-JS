import * as inquirer from "inquirer";
inquirer.registerPrompt("search-list", require("inquirer-search-list"));
inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));

/**
 * A simple choice.
 */
export interface IChoice {
  type: "item";
  name: string;
  value: string;
  onSelect(): Promise<void>;
}

/**
 * A More complex type, which might be rendered.
 */
export interface ICliMenu {
  type: "menu";
  name: string;
  value: string;
  items: TMenuDefinition;
  preventBack?: true;
}

export type TMenuDefinition = Array<IChoice | ICliMenu>;

/**
 * Helper to create an interactive menu using Inquirer.
 * Therefore definition of the menu is required. Once,
 * a choice is selected -> the provided callback is called.
 *
 * Normally, in the menu, a 'back' item is added to go back
 * to the upper menu. Additionally the user gets an 'exit'
 * option to leave the app.
 *
 * @param menu The menu which should be rendered
 * @param options Options to control the behavior of the exit-entry etc.
 */
export async function createInteractiveMenu(
  menu: TMenuDefinition,
  options: {
    addExit?: boolean;
    exitCallback?: () => Promise<void>;
  } = {}
) {
  const defaults = {
    addExit: true,
  };

  const optionsToUse = Object.assign(defaults, options);

  // Define a default exit entry.
  // This will be added to every menu if required.
  const exitChoice: IChoice = {
    name: "exit",
    type: "item",
    onSelect: async () => {
      // If the user provided an extra
      // callback, which should be called
      // on exit ==>  we will perform that.
      if (optionsToUse.exitCallback) {
        await optionsToUse.exitCallback();
      }

      // Now we are able to exit our item.
      process.exit(1);
    },
    value: "exit",
  };

  // We add the exit menu entry if required.
  if (optionsToUse.addExit) {
    menu.push(exitChoice);
  }

  let question = menu;
  let last = menu;

  /**
   * Helper function to find the matching item.
   * @param value The value which will be used during search.
   * @returns
   */
  function findInMenu(value: string) {
    for (const item of question) {
      if (item.value === value) {
        return item;
      }
    }
    return false;
  }

  // Custom back choice. That is quite simple.
  // we will just make shure we are using the
  // last questions we had.
  const backChoice: IChoice = {
    name: "back",
    value: "back",
    async onSelect() {
      question = last;
    },
    type: "item",
  };

  // Now we are running our choices in an endless loop.
  // If the user selects one option => we will either:
  // a) adapt the menu
  // b) execute the callback for the choice.
  while (true) {
    const result = (
      await inquirer.prompt([
        {
          type: "search-list",
          message: "Select the operation to perform",
          name: "option",
          choices: question,
        },
      ])
    ).option;

    // Find our desired action
    const entry = findInMenu(result);

    // Now we will either:
    // a) adapt the menu
    // b) execute the callback for the choice.
    if (entry) {
      switch (entry.type) {
        case "item":
          await entry.onSelect();
          break;
        case "menu":
          last = question;
          question = entry.items;

          if (!entry.preventBack && !question.includes(backChoice)) {
            question.push(backChoice);
          }

          if (optionsToUse.addExit && !question.includes(exitChoice)) {
            question.push(exitChoice);
          }

          break;
      }
    }
  }
}

if (require.main === module) {
  // The following code segment shows the
  // usage of the function

  async function main() {
    createInteractiveMenu([
      {
        type: "item",
        name: "render hello",
        async onSelect() {
          console.log("hello-1");
        },
        value: "hello",
      },
      {
        type: "menu",
        name: "sub-items",
        items: [
          {
            type: "item",
            name: "render hello in submenu",
            async onSelect() {
              console.log("hello from submenu");
            },
            value: "hello",
          },
          {
            type: "menu",
            name: "sub-items",
            items: [
              {
                type: "item",
                name: "render hello in sub-sub-menu",
                async onSelect() {
                  console.log("hello from sub-sub-menu");
                },
                value: "hello",
              },
            ],
            value: "sub-sub-menu",
          },
        ],
        value: "submenu",
      },
    ]);
  }

  main().catch(console.error);
}
