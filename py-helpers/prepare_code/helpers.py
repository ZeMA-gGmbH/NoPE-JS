import ast, _ast

CODE = '''class dotted_dict(dict):
    """dot.notation access to dictionary attributes"""
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__'''

def to_snake_case(str:str)->str:
    """ Helper to convert the string to the snake-case

    Args:
        str (str): The string to convert

    Returns:
        str: The converted string
    """
    if str == str.upper():
        return str

    ret = ''.join(['_'+i.lower() if i.isupper()
                    else i for i in str]).lstrip('_')

    if ret.startswith("_"):
        ret[1:]

    return ret

def define_dotted_dict(type= "name"):
    """ Returns the Deinfition of the dotdict class
    """

    if (type == "name"):
        return _ast.Name(id= "ensureDottedAccess")

    return ast.parse(CODE).body[0]