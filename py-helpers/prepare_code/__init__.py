__title__ = 'prepare_code'
__author__ = 'M.Karkowski'
__license__ = 'MIT'
__copyright__ = 'Copyright 2022 M.Karkowski'
__version__ = '0.1.0'

from .logger import get_logger
from .post_processor import post_process
from .helpers import define_dotted_dict, to_snake_case
from .js import get_parser as get_parser_js, transform as transform_js
from .ts import get_parser as get_parser_ts, transform as transform_ts
from .main import main