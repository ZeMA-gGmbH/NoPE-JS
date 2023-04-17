

replacers = {
    "console.log": "print",
    "console.error": "print",
    "Error(": "Exception(",
    "true": "True",
    "false": "False",
    "JSON.stringify": "json.dumps",
    "JSON.parse": "json.loads",
    "const _this = this;": "",
    "_this": "self",
    "this": "self",
    " Set": " set",
    " Map": " dict",
    "toLowerCase": "lower",
    "toUpperCase": "upper",
    ".push(": ".append(",
    ".indexOf(": ".index(",
    "Array.from": "list",
    "null": "None",
    '"null"': "None",
    '"undefined"': "None",
    'undefined': "None",
    'self = self': "",
    "__definition_of__": "",
    "@property()": "@property",  
    ".entries()": ".items()",     
    "${": "{",    
}

def post_process(code: str) -> str:
    """ Post processes the code. This results in adapting the code by replacing default 
        elements like console.log

    Args:
        code (str): The code that have to be adapted

    Returns:
        str: The adapted code
    """

    for org, new in replacers.items():
        code = code.replace(org, new)

    return code