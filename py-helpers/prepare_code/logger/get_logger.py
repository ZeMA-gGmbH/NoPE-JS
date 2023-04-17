import logging
import sys


def get_logger(name: str, level=logging.INFO):
    """ Creates a Logger for the Tool.

    Args:
        name (str): Name of the logger
        level: The logging Level. Defaults to logging.INFO.

    Returns:
        a. logger
    """
    _logger = logging.getLogger(name)
    # Define  a Logging Format
    _format = _format = logging.Formatter(
        '%(levelname)s - %(message)s')
    # Create Console Output
    _handler = logging.StreamHandler(sys.stdout)
    # Add the Format to the Handler
    _handler.setFormatter(_format)
    # Set Loglevel to the Desired One.
    _handler.setLevel(level)

    # Finally add the Handler to the Logger:
    _logger.addHandler(_handler)

    # Set the Log Level of the Logger.
    _logger.setLevel(level)
    return _logger