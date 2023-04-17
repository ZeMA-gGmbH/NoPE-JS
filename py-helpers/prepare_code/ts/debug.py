import os
import multiprocessing as mp
from pathlib import Path

from parser import get_parser
from transformer import transform

MAX_CPU = mp.cpu_count()

if MAX_CPU <= 4:
    MAX_CPU = 1

else:
    MAX_CPU = MAX_CPU - 2


def parse(parser, path_to_file):
    """ Function to parse the corresponding 

    Args:
        parser (_type_): _description_
        logger (_type_): _description_
        input_path (_type_): _description_
        output_path (_type_): _description_
        name (_type_): _description_
        path_to_file (_type_): _description_
        dir_path (_type_): _description_

    Returns:
        str: _description_
    """

    try:
        code = transform(
            parser.parse(open(path_to_file, encoding="utf-8").read()),
            True
        )

        print(code)

    except Exception as err:
        raise err


if __name__ == "__main__":

    # "C:\Users\m.karkowski\Documents\00-Repos\nope-backend\dist-py\helpers\runtimeMethods.js"

    input_path = Path(__file__).parent.joinpath(
        '..', "..", "..", "dist-py", "helpers")
    path_to_file = os.path.join(input_path, "jsonSchemaMethods.js")

    input_path = Path(__file__).parent.joinpath(
        '..', "..", "..", "dist-py", "helpers")
    path_to_file = os.path.join(input_path, "runtimeMethods.js")

    parse(
        get_parser(),
        path_to_file
    )
