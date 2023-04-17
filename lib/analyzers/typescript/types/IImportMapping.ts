/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:17
 * @modify date 2020-11-05 12:15:18
 * @desc [description]
 */

export type IImportMapping = {
  mapping: {
    [index: string]: {
      importSrc: string;
      alias?: string;
    };
  };
  aliasToOriginal: {
    [index: string]: string;
  };
};
