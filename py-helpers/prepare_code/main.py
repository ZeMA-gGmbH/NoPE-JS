import argparse
import os
import re
import multiprocessing as mp

from . import get_logger, ts, js, post_process, to_snake_case

MAX_CPU = mp.cpu_count()

if MAX_CPU <= 4:
    MAX_CPU = 1

else:
    MAX_CPU = MAX_CPU - 2

func = {
    "ts": ts,
    "js": js
}

def worker(opt):
    """ Helper function, which will be called during a multiprocess. Converts the input.

    Args:
        opt: packed options
    """

    type = opt[0]

    return parse(func[type].get_parser(), *opt)

def parse(parser, type, logger, input_path, output_path, name, path_to_file, dir_path, debug, convert_snake_case):
    """ Function to generate the python-code

    Args:
        parser: The Parser to use (js/ts)
        logger (logging.logger): The Logger
        input_path (str): path of the folder to readin
        output_path (str): main path of the output
        name (str): name of the file
        path_to_file (str): path to the file
        dir_path (str): directory of the file
        debug (boolean): Flag to enable debugging
        convert_snake_case (boolean): Flag to enable converting methods and names to ids.

    Returns:
        (
            (
                str | False,        # Directory of the PY-File, where it should be stored. False in the case of an error
                str | False,        # Filename of the PY-File or False in the case of an error 
                str | False         # Python-Code or False in the case of an error
            ), (
                err | False,        # The Error or False, if everything was fine
                str | False         # Filepointer to the error if parsing using lark failed (clickable pointer for the editor)
            )
        )

    """

    try:

        python_name = name.replace(".ts", ".py").replace(".js", ".py")

        rel_path = dir_path[len(input_path) + 1:]

        if convert_snake_case:
            python_name = to_snake_case(python_name)
            rel_path = to_snake_case(rel_path)

        logger.debug(f"determined the following rel-path = {rel_path}")
        
        pytho_path_to_file = os.path.join(output_path,rel_path,python_name)

        try:
            code = func[type].transform(
                parser.parse(open(path_to_file, encoding="utf-8").read()),
                debug,
                convert_snake_case
            )

            logger.debug(f"converted {path_to_file}")

            code = post_process(code)

            logger.info(f"processed-file: '{path_to_file}'")

            return (
                (os.path.join(output_path,rel_path), pytho_path_to_file , code),
                (False ,False)
            )

        except Exception as err:

            ptr_to_err = path_to_file

            try:

                m = re.search('(?<=line )\d+', str(err))            
                line = int(m.group(0))

                m = re.search('(?<=col )\d+', str(err))            
                col = int(m.group(0))

                ptr_to_err = path_to_file+":"+str(line)+":"+str(col)

            except:
                pass

            logger.error(f"Failed to convert {ptr_to_err}")

            if debug:
                logger.error(err)
            else:
                logger.error(str(err).split("\n")[0])

            return (
                (False, False, False), 
                (str(err), ptr_to_err)
            )

    except Exception as err:
        # An unknown Error has been found
        logger.error(err)
        return (
            (False, False,False), 
            (str(err), False)
        )

def main():
    """ The main routine.
    """


    parser = argparse.ArgumentParser(
        description='Tython. A tool to convert the typescript file to the given python files.')
    parser.add_argument('--input', type=str, default="./", dest='inputFolder',
                        help='Defines the Folder with the Files, being search.')
    parser.add_argument('--output', type=str, default="./out/", dest='outputFolder',
                        help='Defines the Files, which should be looked for. Possible Values are "ts" | "js"')
    parser.add_argument('--type', type=str, default="ts", dest='type',
                        help='Defines the Folder where the converted files should be stored.')
    parser.add_argument('--debug', dest='debug', action='store_true',
                        help='Shows debug related output')
    parser.add_argument('--cores', type=int, default=MAX_CPU, dest='cores',
                        help='The Amount of cores, which must be use')
    parser.add_argument('--convert_snake_case', dest='convert_snake_case', action='store_true',
                        help='Converts the names to snake-case')

    # Create a Logger:
    logger = get_logger("nope-py-prepare")

    args = parser.parse_args()

    files_to_ignore ={
        "js": lambda name: name.endswith(".js") and not (name.endswith(".spec.js") or "index" in name or "\\types\\" in name or "/types/" in name),
        "ts": lambda name: name.endswith(".ts") and not (name.endswith(".spec.ts") or "index" in name),
    }

    if not args.type in ("ts","js"):
        logger.error("Please use the correct type")
        logger.error(f"Determined type: '{args.type}'")
        return
    
    logger.warn(f"Working wiht '{args.type}' file-ending.")

    # Define the Input Path
    input_path = os.path.join(os.getcwd(), args.inputFolder)
    typescript_files = []

    logger.info(f"Checking dir: '{input_path}'")


    if os.path.isdir(input_path):

        # Get all relevant Files.
        for dir_path, directories, files in os.walk(input_path):
            for file_name in files:
                # Generate the Path of files.
                path_to_file = os.path.join(dir_path, file_name)

                if files_to_ignore[args.type](path_to_file):
                    
                    # Show a log message
                    logger.debug(f"Found file: '{file_name}' at '{dir_path}'")

                    # Add the file-name, path to the file and the dir path
                    typescript_files.append((file_name, path_to_file, dir_path))

    elif os.path.isfile(input_path):
        # Generate the Path of files.
        path_to_file = input_path

        if files_to_ignore[args.type](path_to_file):

            dir_path = os.path.dirname(path_to_file)
            file_name = path_to_file[len(dir_path) + 1 :]
            
            # Show a log message
            logger.debug(f"Found file: '{file_name}' at '{dir_path}'")

            # Add the file-name, path to the file and the dir path
            typescript_files.append((file_name, path_to_file, dir_path))

    else:
        raise Exception("Failed to load the file")

    typescript_files = sorted(typescript_files,key=lambda item: item[1])

    # Define the Destination
    output_path = os.path.join(os.getcwd(), args.outputFolder)

    cores_to_use = max(1, min(MAX_CPU, args.cores))

    logger.info(f"Founf {len(typescript_files)} files. Starting multiprocess with {cores_to_use} cores.")

    # Create Pool.
    pool = mp.Pool(cores_to_use)
    results = pool.map(worker, [
        (
            args.type,
            logger,         # The Logger
            input_path,     # The Input Folder
            output_path,    # The Output Path
            file_name,      # Name of the File
            path_to_file,   # Path to the File
            dir_path,        # Path of the Directory.
            args.debug,
            args.convert_snake_case
        ) for file_name, path_to_file, dir_path in typescript_files
    ])
    # Close the Pool
    pool.close()
    # Wait to finish all.
    pool.join()

    success = []
    failed = []
    for (path, py_file_name,content),(err, org_file_name) in results:
        if py_file_name and content:
            success.append(py_file_name)

            
            os.makedirs(path, exist_ok=True)
            with open(py_file_name, "w") as file:
                file.write(content)

        else:
            failed.append((org_file_name, err))

    if len(success):
        print("\n"*2)
        print(f"Created the following files ({len(success)}):")
        for file_name in success:
            print("\t- ", file_name)
    
    if len(failed):
        logger.warn(f"The following files failed ({len(failed)}):")
        for (idx, (file_name, err)) in enumerate(failed):
            print("\t", idx+1, ".\t", file_name)
            print("\t\t\t->",str(err).split("\n")[0])

   

    print("\n"*2)
    logger.info(f"Parsed {len(success)} of {len(typescript_files)} files ({(len(success)/len(typescript_files))*100:.2f} %).")


if __name__ == "__main__":
    main()
