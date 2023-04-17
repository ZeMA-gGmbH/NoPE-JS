import _ast
import ast
import astor
import logging

# from prepare_code import get_logger
from ..logger import get_logger
from ..helpers import to_snake_case, define_dotted_dict
from lark import Transformer

class CodeTransformeJs(Transformer):

    def __init__(self, visit_tokens: bool = True, level=logging.INFO, to_snake_case=False, switch_case_to_if_else=True, **kwargs) -> None:
        super().__init__(visit_tokens)
        self.to_snake_case = to_snake_case
        self.switch_case_to_if_else = switch_case_to_if_else

        self._logger = get_logger("DebugWrapper", level)
        self._callback_counter = 0

        self._anonymous_func_to_ids = dict()
        self._ids_to_anonymous_func = dict()

        # The Key is allways a ast.Node (the Parent Node.)
        # The Value is a Set, containing sub-nodes,
        self._anonymous_func_tree = dict()

        self._skip = [
            "terminator",
            "export",
            "declare_var_type",
            "for_iter_type",
            "skip"
        ]
        self._first = [
            "ret_expr",
            "ret_expr_with_terminator",
            "statement",
            "sum",
            "bool",
            "product",
            "boolean_input",
            "atom",
            "list_item",
            "bracket_accessor",
            "accessor",
            "func_statement",
            "func_arg",
            "call_arg",
            "iter_statement",
            "else_statement",
            "switch_case_statement",
            "switch_case_body_end",
            "class_declarations",
            "for_iter_var",
            "descruct_dict_items",
            "destruct_list_items"
        ]
        self._all = [
            "import_names",
            "list_items",
            "dict_items",
            "func_statements",
            "call_args",
            "iter_statements",
            "else_if_statements",
            "else_if_statement",
            "switch_body",
            "switch_case_statements",
            "class_body"
        ]
        self._contains_body = [
            "for",
            "default_for",
            "ranged_for",
            "multi_for",
            "while_statement",
            "body",
            "if_statement",
            "switch",
            "try_catch",
            "class_statement",
            # "constructor",
            # "method",
            # "async_method",
            "start"
        ]
        self._original = [
            "to_snake_case",
            "switch_case_to_if_else",
            "_logger",
            "_callback_counter",
            "_anonymous_func_to_ids",
            "_ids_to_anonymous_func",
            "_anonymous_func_tree",
            "_get_func_name",
            "_get_name",
            "_adapt_items",
            "_add_to_tree",
            "_add_to_tree_single",
            "_adapt_body",
            "_log",
            "_log_extracted",
            "_skip",
            "_default",
            "_original",
            "_contains_body",
            "transform",
            "start"
        ]

    def __getattribute__(self, __name: str):

        own_attribute = list(__class__.__dict__.keys())

        logger = object.__getattribute__(self, "_logger")
        _original = object.__getattribute__(self, "_original")
        _skip = object.__getattribute__(self, "_skip")
        _first = object.__getattribute__(self, "_first")
        _all = object.__getattribute__(self, "_all")

        if __name in _original:
            return object.__getattribute__(self, __name)

        elif __name in _skip:

            logger.debug(f"getting skipping function for '{__name}'")

            def ret(items):
                self._logger.debug(f"skipping '{__name}'")
                self._log(__name, items)
                return

            return ret

        elif __name in _first:

            logger.debug(f"getting first function for '{__name}'")

            def ret(items):

                self._log(__name, items)

                try:
                    self._logger.debug(
                        f"calling '{__name}' resulted in result={ast.dump(items[0])}")
                    self._logger.debug(
                        f"calling '{__name}' created node-id={items[0]}")
                except:
                    self._logger.debug(
                        f"calling '{__name}' resulted in result={items[0]}")

                return items[0]

            return ret

        elif __name in _all:

            logger.debug(f"getting all function for '{__name}'")

            def ret(items):
                self._log(__name, items)
                self._logger.debug(f"all for '{__name}'")
                return items

            return ret

        elif __name not in own_attribute:

            # logger.debug(f"a unkown function named '{__name}' has been requested. Using Super element")
            return object.__getattribute__(self, __name)

        else:
            attr = object.__getattribute__(self, __name)

            logger.debug(f"using custom function for '{__name}'")

            if callable(attr):

                _contains_body = object.__getattribute__(
                    self, "_contains_body")

                def ret(*args, **kwargs):
                    """ A Custom Function, which is used to 
                        register the function if possible.
                    """
                    try:
                        items = args[0]

                        if __name not in _contains_body:
                            items = self._adapt_items(args[0])
                        
                        self._log(__name, items)

                        # Call the original Function
                        result = attr(items, **kwargs)

                        try:
                            self._logger.debug(
                                f"calling '{__name}' resulted in result={ast.dump(result)}")
                        except:
                            self._logger.debug(
                                f"calling '{__name}' resulted in result={result}")

                        try: 
                            # Test if the Elment does not contain a body.
                            if __name not in _contains_body and type(result) not in (list, tuple, dict):
                                # Now register some callbacks:
                                self._add_to_tree(result, items)

                        except:
                            pass

                        return result

                    except Exception as err:
                        logger.debug(
                            f"failed calling: '{__name}'. reason: {err}")
                        result = attr(*args, **kwargs)

                        return result

                return ret

            return attr

    def _get_func_name(self):
        name = f"callback_{self._callback_counter}"
        self._callback_counter += 1
        return name

    def _get_name(self, str):
        if self.to_snake_case:
            return to_snake_case(str)
        else:
            return str
    
    def _adapt_items(self, items):

        if type(items) is list:

            ret = []

            for item in items:
                if (type(item) is _ast.FunctionDef):
                    ret.append(self._anonymous_func_to_ids[item])
                else:
                    ret.append(item)

            return ret

        elif (type(items) is _ast.FunctionDef):
            return self._anonymous_func_to_ids[items]
        else:
            return items

    def _add_to_tree(self, ret, items):
        """ Create the required Tree.
            ret = Node
            Childs = 
        """
        to_check = []

        if type(items) is list:
            for item in items:
                if type(item) is list:
                    to_check += item
                elif item is not None:
                    to_check.append(item)
        elif items is not None:
            to_check.append(items)

        self._logger.debug(f"'_add_to_tree' -> '{ret}' checks {to_check}")

        for item in to_check:
            try:
                self._add_to_tree_single(ret, item)
            except:
                pass

    def _add_to_tree_single(self, parent, item):
        id = item

        if id in self._ids_to_anonymous_func:
            if parent not in self._anonymous_func_tree:
                self._anonymous_func_tree[parent] = set()

            self._anonymous_func_tree[parent].add(
                self._ids_to_anonymous_func[id]
            )

            self._logger.debug(f"\t\t'{parent}' added defintions (function_defintion) for  {self._anonymous_func_tree[parent]}")

        elif id in self._anonymous_func_to_ids:
            if parent not in self._anonymous_func_tree:
                self._anonymous_func_tree[parent] = set()

            self._anonymous_func_tree[parent].add(
                id
            )

            self._logger.debug(f"\t\t'{parent}' added defintions (a function) for  {self._anonymous_func_tree[parent]}")

        elif item in self._anonymous_func_tree:
            if parent not in self._anonymous_func_tree:
                self._anonymous_func_tree[parent] = set()

            s = self._anonymous_func_tree[parent]
            # Store the contained Ids.
            self._anonymous_func_tree[parent] = s.union(
                self._anonymous_func_tree[item])

            self._logger.debug(f"\t\t'{parent}' added defintions (a containing node) for  {self._anonymous_func_tree[parent]}")

        else:
            self._logger.debug(f"\t\tfailed to find function for '{id}'")
            self._logger.debug(f"\t\t_anonymous_func_to_ids: '{self._anonymous_func_to_ids}'")
            self._logger.debug(f"\t\t_ids_to_anonymous_func: '{self._ids_to_anonymous_func}'")

    def _adapt_body(self, body):
        defintions_to_add = set()

        for item in body:
            if item in self._anonymous_func_tree:
                self._logger.debug(f"Found callback items for {item}")
                defintions_to_add = defintions_to_add.union(
                    self._anonymous_func_tree[item])
                self._anonymous_func_tree.pop(item)

        if len(defintions_to_add):
            return self._adapt_body(list(defintions_to_add) + body)

        return body

    def _log(self, name, items):
        try:
            self._logger.debug(
                f"calling -> '{name}' -> type(items) = {type(items)}; len(items) = {len(items)}")

            for idx, item in enumerate(items):
                try:
                    if type(item) is list:
                        for _idx, _item in enumerate(item):
                            try:
                                self._logger.debug(
                                    f"\t\titem[{idx}]->{_idx}: {ast.dump(_item)} - '{_item}'")
                            except:
                                self._logger.debug(
                                    f"\t\titem[{idx}]->{_idx}: {_item}")
                    else:
                        self._logger.debug(
                            f"\t\titem[{idx}]: {ast.dump(item)} - '{_item}'")
                except:
                    self._logger.debug(
                        f"\t\titem[{idx}]: {item}")
        except:
            self._logger.debug(
                f"calling -> '{name}' -> type(items) = {type(items)}")

    def _log_extracted(self, name, **args):
        try:
            self._logger.debug(f"calling -> '{name}' -> args = {dict(**args)}")
        except:
            pass

    
    def start(self, items):
        self._log("start", items)
        body = self.body(items)
        # We dont want to add our custom class.
        # body.insert(0, define_dotted_dict("ast"))
        return _ast.Module(body=body)

    def return_statement(self, items):
        i = items[0]
        return _ast.Return(value=items[0])

    def identifier(self, items):
        self._log("id", items)
        return _ast.Name(id=self._get_name(items[0].value))

    def import_stmt_all(self, items):
        self._log("import_stmt_all", items)
        module, terminator = items
        self._log_extracted("import_stmt_all", module=module,
                            terminator=terminator)
        return _ast.Import(name=_ast.alias(name=module.value))

    def import_stmt_id(self, items):
        self._log("import_stmt_id", items)
        return items

    def import_stmt_as(self, items):
        self._log("import_stmt_as", items)
        (identifier, module, __) = items
        names = []
        if module.value == identifier:
            names = [_ast.alias(name=module.value, asname=None)]
        else:
            names = [_ast.alias(name=module.value, asname=identifier)]
        self._log_extracted("import_stmt_as",
                            identifier=identifier, module=module)
        return _ast.Import(names=names)

    def import_stmt_from(self, items):

        self._log("import_stmt_from", items)
        (import_names, _, __) = items
        self._log_extracted("import_stmt_from", import_names=import_names)

        # TODO: determine the level properly
        return _ast.ImportFrom(module=_.value.replace('/', '.'), names=import_names, level=0)

    def import_name(self, items):
        (items,) = items
        return _ast.alias(name=items, asname=None)

    def import_as_name(self, items):
        (import_name, as_name) = items
        return _ast.alias(name=import_name, asname=as_name)

    def str(self, items):

        self._log("str", items)
        (items,) = items
        items = items[1:-1]
        return _ast.Constant(value=items)

    def str_multi_line(self, items):
        (items,) = items
        items = items[1:-1]
        return _ast.Constant(value=items)

    def num(self, items):
        self._log("num", items)

        dig_01 = items[0].value
        dig_02 = items[1].value if items[1] is not None else 0

        value = float(str(f"{dig_01}.{dig_02}"))

        if items[1] is None:
            value = int(dig_01)        

        return _ast.Constant(value=value)

    def bool_true(self, items):
        return _ast.Constant(value=True)

    def bool_false(self, items):
        return _ast.Constant(value=False)

    def null(self, items):
        return _ast.Constant(value=None)

    def undefined(self, items):
        return _ast.Constant(value=None)

    def increment(self, items):
        return self.assigned_add([items[0], _ast.Constant(value=1)])

    def decrement(self, items):
        return self.assigned_sub([items[0], _ast.Constant(value=1)])

    def invert(self, items):
        ret = _ast.UnaryOp(
            op=_ast.Not(),
            operand=items[0]
        )

        return ret

    def istanceof(self, items):
        return _ast.Call(
            func=_ast.Name(id='isinstance'),
            args=[
                items[0],
                items[1]
            ],
            keywords=[]
        )

    def typeof(self, items):
        return _ast.Call(
            func=_ast.Name(id='type'),
            args=[
                items[0]
            ],
            keywords=[]
        )

    def instanceof(self, items):

        ret = self._op(
            [
                _ast.Call(
                    func=_ast.Name(id='type'),
                    args=[
                        items[0],
                    ],
                    keywords=[]
                ),
                items[1]
            ],
            self.bool_op_is([])
        )
        return ret

    def delete_stmt(self, items):
        return _ast.Delete(
            targets=[
                items[0]
            ]
        )

    def await_stmt(self, items):
        return _ast.Await(
            value=items[0]
        )

    def reg_ex(self, items):
        return _ast.Call(
            func=_ast.Name(id='re.compile'),
            args=[
                _ast.Constant(value=items[0].value)
            ],
            keywords=[]
        )

    def add(self, items):
        return self._op(items, _ast.Add())

    def sub(self, items):
        return self._op(items, _ast.Sub())

    def mult(self, items):
        return self._op(items, _ast.Mult())

    def div(self, items):
        return self._op(items, _ast.Div())

    def _op(self, items, op):
        self._log("assigned_add", items)

        return _ast.BinOp(
            left=items[0],
            op=op,
            right=items[1]
        )

    def _assigned_op(self, items, op):
        self._log("assigned_add", items)

        return self.reassign([
            items[0],
            self._op(items, op)
        ])

    def assigned_add(self, items):
        return self._assigned_op(items, _ast.Add())

    def assigned_sub(self, items):
        return self._assigned_op(items, _ast.Sub())

    def assigned_mult(self, items):
        return self._assigned_op(items, _ast.Mult())

    def assigned_div(self, items):
        return self._assigned_op(items, _ast.Div())

    def boolean_operation(self, items):
        self._log("boolean_operation", items)

        ret = _ast.Compare(
            left=items[0],
            ops=[
                items[1]
            ],
            comparators=[
                items[2]
            ]
        )

        return ret

    def bool_op_gt(self, items):
        return _ast.Gt()

    def bool_op_lt(self, items):
        return _ast.Lt()

    def bool_op_gte(self, items):
        return _ast.GtE()

    def bool_op_lte(self, items):
        return _ast.LtE()

    def bool_op_eq(self, items):
        return _ast.Eq()

    def bool_op_not_eq(self, items):
        return _ast.NotEq()

    def bool_op_and(self, items):
        return _ast.And()

    def bool_op_or(self, items):
        return _ast.Or()

    def bool_op_in(self, items):
        return _ast.In()

    def bool_op_is(self, items):
        return _ast.Is()

    def list(self, items):
        if items[0] is not None:

            _items = self._adapt_items(items[0])

            ret = _ast.List(
                elts=_items,
                ctx=ast.Load()
            )

            return ret

        return _ast.List(
            elts=[],
            ctx=ast.Load()
        )

    def list_item_rest(self, items):
        self._log("list_item_rest", items)

        ret = _ast.Starred(
            value=items[0]
        )

        return ret

    def descruct_list(self, items):

        ret = []

        for idx, target in enumerate(items[0]):

            ret.append(
                self.declare_var([
                    # Use the
                    target,
                    _ast.Subscript(
                        value=items[1],
                        slice=_ast.Constant(value=idx)
                    )
                ])
            )

        return ret

    def dict(self, items):

        keys = []
        values = []

        if items[0]:
            for item in items[0]:
                keys += item["keys"]
                values += item["values"]

        args = self.func_args([])
        args.args= [
            _ast.Dict(
                keys=keys,
                values=self._adapt_items(values),
                ctx=ast.Load()
            )
        ]

        ret = self.new_class([
            define_dotted_dict(),
            [
                _ast.Dict(
                    keys=keys,
                    values=self._adapt_items(values),
                    ctx=ast.Load()
                )
            ]
        ])

        # ret = _ast.Dict(
        #     keys=keys,
        #     values=self._adapt_items(values),
        #     ctx=ast.Load()
        # )

        return ret

    def dict_item_default(self, items):

        id = ""
        if type(items[0]) is _ast.Name:
            id = items[0].id
        elif type(items[0]) is _ast.Constant:
            id = items[0].value
        else:
            raise Exception("unkown type handled... :(")

        return {
            "keys":   [_ast.Constant(value=id)],
            "values": [items[1]]
        }

    def dict_item_func(self, items):
        # TODO: How to Handle.
        return {
            "keys":  [_ast.Constant(value=items[0].id)],
            "values": [items[0]]
        }

    def dict_item_rest(self, items):
        return {
            "keys":  [None],
            "values": [items[0]]
        }

    def dict_item_short(self, items):
        return {
            "keys":  [_ast.Constant(value=items[0].id)],
            "values": [items[0]]
        }

    def declare_descruct_list_var(self, items):
        # Rule = declare_var_type "[" (id [","])* [","] rest_accessor "]" "=" ret_expr terminator

        source = items[-2]

        # Define a new name
        id_of_copy = _ast.Name(id=self._get_name(f"tmp_cp"))

        ret = []

        # We iterate over the items.
        for [idx, item] in enumerate(items[1:-2]):
            if item is None:
                continue
            elif item.get("rest", False):
                # Our rest item should allways be
                ret.insert(
                    len(ret),
                    self.reassign(
                        [
                            item.get("rest"),
                            id_of_copy
                        ]
                    )
                )
            else:
                ret.insert(
                    idx,
                    self.reassign(
                        [
                            item.get("assign_name"),
                            self.function_call(
                                [
                                    self.access_dot([
                                        id_of_copy,
                                        _ast.Name(id="pop")
                                    ]),
                                    [
                                        _ast.Constant(value=idx)
                                    ]
                                ]
                            )
                        ]
                    )
                )

        ret.insert(0,
                   # Firstly, we want to copy our element.
                   self.reassign([
                       id_of_copy,
                       self.function_call([
                           _ast.Name(id="deepcopy"),
                           [
                               source
                           ]
                       ])
                   ])
                   )

        return ret

    def destruct_list_rest(self, items):
        return self.destruct_dict_rest(items)

    def destruct_list_item(self, items):
        return {
            "assign_name": items[0]
        }

    def declare_descruct_dict_var(self, items):
        # TODO: Impement
        _ = items[0]
        source = items[-2]
        # Define a new name
        id_of_copy = _ast.Name(id=self._get_name(f"tmp_cp"))

        ret = []

        # We iterate over the items.
        for item in items[1:-2]:
            if item is None:
                continue
            elif item.get("rest", False):
                # Our rest item should allways be
                ret.insert(
                    len(ret),
                    self.reassign(
                        [
                            item.get("rest"),
                            id_of_copy
                        ]
                    )
                )
            else:
                ret.insert(
                    -1,
                    self.reassign(
                        [
                            item.get("assign_name"),
                            self.function_call(
                                [
                                    self.access_dot([
                                        id_of_copy,
                                        _ast.Name(id="pop")
                                    ]),
                                    [
                                        item.get("extract_name")
                                    ]
                                ]
                            )
                        ]
                    )
                )

        ret.insert(0,
                   # Firstly, we want to copy our element.
                   self.reassign([
                       id_of_copy,
                       self.function_call([
                           _ast.Name(id="deepcopy"),
                           [
                               source
                           ]
                       ])
                   ])
                   )

        return ret

    def destruct_dict_single_id(self, items):
        return {
            "extract_name": items[0],
            "assign_name": items[0]
        }

    def destruct_dict_renamed(self, items):
        return {
            "extract_name": items[0],
            "assign_name": items[1]
        }

    def destruct_dict_rest(self, items):
        return {
            "rest": items[0]
        }

    def declare_var(self, items):

        (_, __, id, value) = items

        self._log("declare_var", items)
        try:
            self._logger.debug(
                f"declare_var: id={ast.dump(id)}; value={ast.dump(value)}")
        except:
            pass

        _value = self._adapt_items(value)

        ret = _ast.Assign(
            targets=[id],
            value=_value
        )

        return ret

    def declare_var_not_initialized(self, items):
        return _ast.Assign(
            targets=[items[0]],
            value=_ast.Constant(value=None)
        )

    def declare_var_descructed(self, items):
        # Return only the desturcted stuff
        return items[0]

    def var_based_access(self, items):
        return _ast.Name(id=items[0])

    def access_len(self, items):
        """ Convert item.size / item.length to len(...)
        """

        return _ast.Call(
            func=_ast.Name(id='len'),
            args=[
                items[0],
            ],
            keywords=[]
        )

    def access_filter(self, items):
        """ Convert item.size / item.length to len(...)
        """

        return self.function_call(
            [
                _ast.Name(id='filter'),
                [
                    items[1][0],
                    items[0]
                ]
                
            ]
        )

    def access_map(self, items):
        """ Convert item.size / item.length to len(...)
        """

        return self.function_call(
            [
                _ast.Name(id='map'),
                [
                    items[1][0],
                    items[0]
                ]
                
            ]
        )

    def access_dot(self, items):

        if type(items[1]) is _ast.Name:

            ret = _ast.Attribute(
                value=items[0],
                attr=items[1].id,
                ctx=ast.Load()
            )

            return ret

        ret = _ast.Attribute(
            value=items[0],
            attr=items[1],
            ctx=ast.Load()
        )

        return ret

    def access_bracket(self, items):
        return _ast.Subscript(
            value=items[0],
            slice=items[1]
        )

    def rest_accessor(self, items):
        return _ast.Call(
            func=_ast.Name(id='deepcopy'),
            args=[
                items[0],
            ],
            keywords=[]
        )

    def reassign(self, items):
        return self.declare_var([None, None, items[0], items[1]])

    def _function(self, items, func_type=None):
        """ Uses Rule = [export] "function" [id] "(" [func_args] ")" func_body

        Args:
            items (tuple|list): The items during tree tranversion. Len must be 4
            type (str, optional): Must be 'async' for an async function / method. Defaults to None.

        Returns:
            _type_: _description_
        """

        _constructor = _ast.AsyncFunctionDef if func_type == "async" else _ast.FunctionDef

        (export, name, func_args, body) = items

        if name is None:
            # TODO: Get name for callback
            name = _ast.Name(id=self._get_func_name())

        func_args = func_args if func_args is not None else _ast.arguments(
            args=[], defaults=[])

        self._logger.debug(
            f"_function: name={name}, func_args={func_args}, body={body}")

        _body = self._adapt_body(body)

        kwargs = {
            "name": name.id,
            "body": _body,
            "args": func_args,
            "decorator_list": []
        }

        ret = _constructor(** kwargs)

        # Register the Function.
        def_name = _ast.Name(id = "__definition_of__"+name.id)
        self._anonymous_func_to_ids[ret] = def_name
        self._ids_to_anonymous_func[def_name] = ret

        return ret

    def function(self, items):
        self._log("function", items)

        return self._function(items)

    def async_function(self, items):
        self._log("async_function", items)

        return self._function(items, func_type="async")

    def _arrow_function(self, items, func_type=None):
        self._log("_arrow_function", items)
        return self._function([None, None, *items], func_type=func_type)

    def arrow_function(self, items):
        self._log("arrow_function", items)

        return self._arrow_function(items)

    def arrow_function_one_arg(self, items):
        self._log("arrow_function", items)

        return self._arrow_function(items)

    def async_arrow_function(self, items):
        self._log("async_arrow_function", items)

        return self._arrow_function(items, func_type="async")

    def func_args(self, items):
        ret = {
            "args":    [],
            "defaults": [],
            "vararg":   []
        }

        for item in items:

            ret["args"] += item["args"]
            ret["defaults"] += item["defaults"]
            ret["vararg"] += item["vararg"]

        if len(ret["vararg"]) == 0:
            ret.pop("vararg")
        elif len(ret["vararg"]) > 1:
            raise Exception("Using multiple ")
        else:
            ret["vararg"] = ret["vararg"][0]


        args = _ast.arguments(**ret)

        self._add_to_tree(args, ret["args"] + ret["defaults"])

        return args

    def default_func_arg(self, items):

        self._log("default_func_arg", items)
        # TODO: Implement
        return {
            "args":    [_ast.arg(arg=items[0].id)],
            "defaults": [],
            "vararg": []
        }

    def rest_func_arg(self, items):
        self._log("rest_func_arg", items)
        return {
            "vararg": [_ast.arg(arg=items[0].id)],
            "args": [],
            "defaults": []
        }

    def assigend_func_arg(self, items):

        self._log("assigend_func_arg", items)
        return {
            "args":    [_ast.arg(arg=items[0].id)],
            "defaults": [items[1]],
            "vararg": []
        }

    def body_or_expr_with_terminator(self, items):
        ret = []

        if type(items[0]) is list:
            ret += items[0]
        else:
            ret.append(items[0])

        return ret

    def body(self, items):
        ret = []

        self._log("func_body", items)

        for item in items:
            if item is not None:
                if type(item) is list:
                    ret += item
                else:
                    ret.append(item)
        try:
            ret = self._adapt_body(ret)
        except:
            pass

        return ret

    def function_call(self, items):
        """ Uses Rule = accessor "(" [call_args] ")"

        Args:
            items (_type_): _description_

        Returns:
            _type_: _description_
        """

        self._log("function_call", items)

        id = items[0]
        args = items[1] if items[1] is not None else []

        args = self._adapt_items(args)

        ret = _ast.Call(
            func=id,
            args=args,
            keywords=[]
        )

        # self._add_to_tree(ret, args)

        return ret

    def rest_call_arg(self, items):
        return _ast.Starred(
            value=items[0]
        )

    def default_for(self, items):
        # Rule = "for" "(" declare_var_type id for_iter_type ret_expr ")" body_or_expr_with_terminator
        (_, id, __, expr, body) = items
        return _ast.For(
            target=id,
            iter=expr,
            body=body,
            orelse=[]
        )

    def multi_for(self, items):

        names = items[1:-3]
        source = items[-2]
        body = items[-1]

        # Define a new name
        iter_item = _ast.Name(id=self._get_name(f"iter_item"))

        # We extend the body.
        for idx, name in enumerate(names):
            body.insert(
                idx,
                self.reassign(
                    [
                        name,
                        self.access_bracket(
                            [
                                iter_item,
                                _ast.Constant(value=idx)
                            ]
                        )
                    ]
                )
            )

        # Now we will extract our Loop
        return self.default_for(
            [
                None,
                iter_item,
                None,
                source,
                body
            ]
        )

    def ranged_for(self, items):
        """ We will convert a for (i, ...) to a while operation.
            Therefore we use the initial assignment, before we
            create the while loop. Inside of the loop, we will
            add the "loop"-operation. It will be executed allways.
            

        Args:
            items: The Tree, which is used to create the wole statement.
        """
        # Rule = "for" "(" declare_var_type id "=" ret_expr ";" ret_expr ";" ret_expr ")" body_or_expr_with_terminator 

        (_, name, init_value, comp, loop_operation, body) = items

        # We have to insert our loop_operation at the end:
        body.insert(-1,loop_operation)

        ret = [
            self.reassign([name, init_value]),
            self.while_statement([
                comp,
                body
            ])
        ]

        return ret

    def while_statement(self, items):
        self._log("while_statement", items)
        self._logger.debug(items[0])
        self._logger.debug(items[1])
        return _ast.While(
            test=items[0],
            body=self._adapt_body(
                items[1] if type(items) == list else [items[1]]
            ),
            orelse=[]
        )

    def continue_statement(self, items):
        return _ast.Continue()

    def break_statement(self, items):
        return _ast.Break()

    def if_statement(self, items):

        test = items[0]
        body = items[1]
        elifs = items[2]
        else_body = self._adapt_body(items[3]) if items[3] is not None else []

        inclused_elif = elifs is not None

        if inclused_elif:
            def _rec(idx):
                (_test, _body) = elifs[idx]
                if idx < len(elifs) - 1:
                    return _ast.If(
                        test=_test,
                        body=self._adapt_body(_body),
                        orelse=[
                            _rec(idx+1)
                        ]
                    )

                # Now we know, that we are working with
                # the last item
                return _ast.If(
                    test=_test,
                    body=self._adapt_body(_body),
                    orelse=else_body
                )

            return _ast.If(
                test=test,
                body=self._adapt_body(body),
                orelse=[
                    _rec(0)
                ]
            )

        return _ast.If(
            test=test,
            body=self._adapt_body(body),
            orelse=else_body
        )

    def inline_if(self, items):

        _items = self._adapt_items(items)

        ret = _ast.IfExp(
            test=_items[0],
            body=_items[1],
            orelse=_items[2]
        )

        return ret

    def new_class(self, items):
        identifier = items[0]
        args = items[1] if items[1] is not None else []
        return _ast.Call(func=_ast.Name(id=identifier), args=args, keywords=[])

    def switch(self, items):

        subject = items[0]

        if self.switch_case_to_if_else:

            else_body = None
            elifs = []

            for item in items[1]:
                if item is None:
                    continue
                if item.get("else", False):
                    else_body = item.get("body")
                else:
                    right = item.get("condition")
                    left = subject

                    _test = self.boolean_operation([left, _ast.Eq(), right])
                    _body = item.get("body")

                    elifs.append((_test, _body))

            if len(elifs) == 0:
                raise Exception("Can not convert switch case.")

            test, body = elifs.pop(0)

            if len(elifs) == 0:
                elifs = None

            return self.if_statement((test, body, elifs, else_body))

        return _ast.Match(
            subject=items[0],
            cases=items[1]
        )

    def switch_case(self, items):

        body = self._adapt_body(
            items[1]
        )

        if self.switch_case_to_if_else:
            return {
                "body": body,
                "condition": items[0]
            }
        else:

            ret = _ast.match_case(
                pattern=_ast.MatchValue(value=items[0]),
                body=body
            )

            return ret

    def switch_default(self, items):

        body = self._adapt_body(
            items[0]
        )

        if self.switch_case_to_if_else:
            return {
                "body": body,
                "else": True
            }

        return self.switch_case([_ast.Name(id="_"), body])

    def switch_case_body(self, items):
        return items[0]

    def try_catch(self, items):

        try_body, err_id, catch_body, finally_body = items

        _try_body = self._adapt_body(try_body)
        _catch_body = self._adapt_body(catch_body)
        _finally_body = self._adapt_body(
            finally_body if finally_body is not None else [])

        ret = _ast.Try(
            body=_try_body,
            handlers=[
                _ast.ExceptHandler(
                    type=_ast.Name(id='Exception'),
                    name=err_id.id,
                    body=_catch_body,
                )

            ],
            orelse=[],
            finalbody=_finally_body
        )

        return ret

    def throw_statement(self, items):
        return _ast.Raise(
            exc=items[0]
        )

    def throw_error_statement(self, items):
        return _ast.Raise(
            exc=items[0]
        )

    def class_statement(self, items):
        (_, name, base, body) = items

        bases = []

        if base is not None:
            bases = [base]
        
        return _ast.ClassDef(name=name.id, body=body,
                            decorator_list=[], bases=bases)

    def decorated_class_statement(self, items):
        return class_statement(self, items[0])

    def constructor(self, items):
        # Rule = "constructor" "(" [func_args] ")" func_body
        # -> args = _ast.arguments
        (args, body) = items

        # Add the Self Symbol
        args = args if args is not None else _ast.arguments(
            args=[], defaults=[])
        args.args.insert(0, _ast.arg(arg='self', annotation=None))

        return _ast.FunctionDef(name='__init__', args=args, body= self._adapt_body(body), decorator_list=[])

    def getter(self, items):
        # Rule = id "(" [func_args] ")" func_body

        # Adapt the ID to "get_{id}"
        id = items[0]
        body = items[1]

        ret = self.method([id, None, body])
        ret.decorator_list.append(
            self.function_call([
                _ast.Name(id="property"),
                None
            ])
        )

        return ret

    def setter(self, items):
        # Rule = "set" id "(" func_arg ")" func_body
        id = items[0]
        args = items[1]["args"]
        body = items[2]

        ret = self.method([id, _ast.arguments(args=args, defaults=[]), body])
        ret.decorator_list.append(
            self.function_call([
                _ast.Name(id=id.id+".setter"),
                None
            ])
        )

        return ret

    def method(self, items):
        # Rule = id "(" [func_args] ")" func_body
        ret = self._function([None, *items])

        method_args = [_ast.arg(arg='self', annotation=None)]
        method_args.extend(ret.args.args)
        ret.args.args = method_args

        return ret

    def async_method(self, items):
        # Rule = "async" id "(" [func_args] ")" func_body
        ret = self._function([None, *items], func_type="async")

        method_args = [_ast.arg(arg='self', annotation=None)]
        method_args.extend(ret.args.args)
        ret.args.args = method_args

        return ret


def transform(tree, debug, to_snake_case):
    transformer = CodeTransformeJs(
        level = logging.DEBUG if debug else logging.INFO,
        to_snake_case = to_snake_case
    )

    program = transformer.transform(tree)

    code = astor.to_source(program)

    if debug:
        print(ast.dump(program, indent=2))

        l = 80

        print("\n"*2)
        print("-"*l)
        print("| Code Below :" + " "*(l-15) + "|")
        print("-"*l)
        print("\n"*2)

        print(code)

    return code
