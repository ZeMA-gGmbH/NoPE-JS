import _ast
import ast
import astor
import logging

from ..logger import get_logger
from lark import Transformer

class CodeTransformeTs(Transformer):

    def __init__(self, visit_tokens: bool = True, level=logging.INFO) -> None:
        super().__init__(visit_tokens)
        self.logger = get_logger("DebugWrapper", level)
        self._callback_counter = 0

        self._anonymous_func_to_ids = dict()
        self._ids_to_anonymous_func = dict()

        # The Key is allways a ast.Node (the Parent Node.)
        # The Value is a Set, containing sub-nodes,
        self._anonymous_func_tree = dict()

    def _get_func_name(self):
        name = f"callback_{self._callback_counter}"
        self._callback_counter += 1
        return name

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

    def _add_to_tree(self, parent, items):
        """ Create the required Tree.
            Parent = Node
            Childs = 
        """
        if parent not in self._anonymous_func_tree:
            self._anonymous_func_tree[parent] = set()

        if type(items) is list:

            for item in items:
                self._add_to_tree_single(parent, item)
        else:
            self._add_to_tree_single(parent, items)

    def _add_to_tree_single(self, parent, item):
        if item in self._ids_to_anonymous_func:
            self._anonymous_func_tree[parent].add(
                self._ids_to_anonymous_func[item]
            )
        elif item in self._anonymous_func_tree:
            s = self._anonymous_func_tree[parent]
            # Store the contained Ids.
            self._anonymous_func_tree[parent] = s.union(
                self._anonymous_func_tree[item])

    def _adapt_body(self, body):
        defintions_to_add = set()

        for item in body:
            if item in self._anonymous_func_tree:
                defintions_to_add = defintions_to_add.union(
                    self._anonymous_func_tree[item])
                self._anonymous_func_tree.pop(item)

        return list(defintions_to_add) + body

    def log(self, name, items):
        try:
            self.logger.debug(
                f"calling -> '{name}' -> type(items) = {type(items)}; len(items) = {len(items)}")
        except:
            self.logger.debug(
                f"calling -> '{name}' -> type(items) = {type(items)}")

    def log_extracted(self, name, **args):
        try:
            self.logger.debug(f"calling -> '{name}' -> args = {dict(**args)}")
        except:
            pass

    def start(self, items):
        self.log("start", items)

        body = self._adapt_body(items)
        ret = _ast.Module(body=body)

        self._add_to_tree(ret, body)

        return ret

    def ret_expr(self, items):
        self.log("ret_expr", items)
        return items[0]

    def ret_expr_with_terminator(self, items):
        self.log("ret_expr_with_terminator", items)
        ret_expr, terminator = items
        self.log_extracted("ret_expr_with_terminator",
                           ret_expr=ret_expr, terminator=terminator)
        return ret_expr

    def return_statement(self, items):
        self.log("ret_expr_with_terminator", items)

        (ret_expr, ) = items

        self.log_extracted("return_statement", ret_expr=ret_expr)

        return _ast.Return(value=ret_expr)

    def statement(self, items):
        return items[0]

    def terminator(self, items):
        """ We want to skip the terminators.
        """
        self.log("terminator", items)
        return

    def identifier(self, items):
        self.log("id", items)
        return _ast.Name(id=items[0].value)

    def import_stmt_all(self, items):
        self.log("import_stmt_all", items)
        module, terminator = items
        self.log_extracted("import_stmt_all", module=module,
                           terminator=terminator)
        return _ast.Import(name=_ast.alias(name=module.value))

    def import_stmt_id(self, items):
        self.log("import_stmt_id", items)
        return items

    def import_stmt_as(self, items):
        self.log("import_stmt_as", items)
        (identifier, module, __) = items
        if module.value == identifier:
            names = [_ast.alias(name=module.value, asname=None)]
        else:
            names = [_ast.alias(name=module.value, asname=identifier)]
        self.log_extracted("import_stmt_all",
                           identifier=identifier, module=module)
        return _ast.Import(names=names)

    def import_stmt_from(self, items):

        self.log("import_stmt_from", items)
        (import_names, _, __) = items
        self.log_extracted("import_stmt_from", import_names=import_names)

        # TODO: determine the level properly
        return _ast.ImportFrom(module=_.value.replace('/', '.'), names=import_names, level=0)

    def import_names(self, items):
        return items

    def import_name(self, items):
        (items,) = items
        return _ast.alias(name=items, asname=None)

    def import_as_name(self, items):
        (import_name, as_name) = items
        return _ast.alias(name=import_name, asname=as_name)

    def str(self, items):

        self.log("str", items)
        (items,) = items
        items = items[1:-1]
        return _ast.Constant(value=items)

    def str_multi_line(self, items):
        (items,) = items
        items = items[1:-1]
        return _ast.Constant(value=items)

    def num(self, items):
        self.log("num", items)

        dig_01 = items[0].value
        dig_02 = items[1].value if items[1] is not None else 0

        value = float(str(f"{dig_01}.{dig_02}"))

        return _ast.Constant(value=value)

    def bool(self, items):
        if items.value == "false":
            return _ast.Constant(value=False)
        return _ast.Constant(value=True)

    def null(self, items):
        return _ast.Constant(value=None)

    def undefined(self, items):
        return _ast.Constant(value=None)

    def increment(self, items):
        return self.assigned_add([items[0], _ast.Constant(value=1)])

    def decrement(self, items):
        return self.assigned_sub([items[0], _ast.Constant(value=1)])

    def invert(self, items):
        return _ast.UnaryOp(
            op=_ast.Not(),
            operand=items[0]
        )

    def istanceof(self, items):
        return _ast.Call(
            func=_ast.Name(id='isinstance', ctx=ast.Load()),
            args=[
                items[0],
                items[1]
            ],
            keywords=[]
        )

    def typeof(self, items):
        return _ast.Call(
            func=_ast.Name(id='type', ctx=ast.Load()),
            args=[
                items[0]
            ],
            keywords=[]
        )

    def instanceof(self, items):
        return _ast.Call(
            func=_ast.Name(id='type', ctx=ast.Load()),
            args=[
                items[0]
            ],
            keywords=[]
        )

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
            func=_ast.Name(id='re.compile', ctx=ast.Load()),
            args=[
                items[0]
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
        self.log("assigned_add", items)

        return _ast.BinOp(
            left=items[0],
            op=op,
            right=items[1]
        )

    def _assigned_op(self, items, op):
        self.log("assigned_add", items)

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
        self.log("boolean_operation", items)

        return _ast.Compare(
            left=items[0],
            ops=[
                items[1]
            ],
            comparators=[
                items[2]
            ]
        )

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

    def boolean_input(self, items):
        return items[0]

    def list(self, items):
        if items[0] is not None:

            _items = self._adapt_items(items[0])

            ret = _ast.List(
                elts=_items,
                ctx=ast.Load()
            )

            self._add_to_tree(ret, _items)

            return ret

        return _ast.List(
            elts=[],
            ctx=ast.Load()
        )

    def list_items(self, items):
        self.log("list_items", items)
        return items

    def list_item(self, items):
        self.log("list_item", items)
        return items[0]

    def list_item_rest(self, items):
        self.log("list_item_rest", items)
        return _ast.Starred(
            value=items[0]
        )

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

        if type(items[0]) == list:

            for item in items[0]:
                keys += item["keys"]
                values += values["values"]

        ret = _ast.Dict(
            keys=keys,
            values=self._adapt_items(values),
            ctx=ast.Load()
        )

        self._add_to_tree(ret, values)

        return ret

    def dict_items(self, items):
        self.log("dict_items", items)
        return items[0]

    def dict_item_default(self, items):
        return {
            "keys":  [items[0]],
            "values": [items[1]]
        }

    def dict_item_func(self, items):
        # TODO: How to Handle.
        return {
            "keys":  [items[0].value],
            "values": []
        }

    def dict_item_rest(self, items):
        return {
            "keys":  [None],
            "values": [items[0]]
        }

    def dict_item_short(self, items):
        return {
            "keys":  [_ast.Constant(value=items[0].value)],
            "values": [items[0]]
        }

    def descruct_dict(self, items):
        # TODO: Impement
        return _ast.Constant(value=f"DICT_DESCRUTION from dict '{items[1].value}'")

    def export(self, items):
        return

    def declare_var(self, items):

        (_, __, id, value) = items

        self.log("declare_var", items)
        try:
            self.logger.debug(
                f"declare_var: id={ast.dump(id)}; value={ast.dump(value)}")
        except:
            pass

        _value = self._adapt_items(value)

        ret = _ast.Assign(
            targets=[id],
            value=_value
        )

        self._add_to_tree(ret, _value)

        return ret

    def declare_var_not_initialized(self, items):
        return _ast.Assign(
            targets=[items[0]],
            value=_ast.Assign(value=None)
        )

    def declare_var_descructed(self, items):
        # Return only the desturcted stuff
        return items[1]

    def bracket_accessor(self, items):
        return items[0]

    def accessor(self, items):
        return items[0]

    def var_based_access(self, items):
        return _ast.Name(id=items[0], ctx=ast.Load())

    def simple_access(self, items):
        return items[0]

    def access_dot(self, items):

        if type(items[1]) is _ast.Name:
            return _ast.Attribute(
                value=items[0],
                attr=items[1].id,
                ctx=ast.Load()
            )

        return _ast.Attribute(
            value=items[0],
            attr=items[1],
            ctx=ast.Load()
        )

    def access_bracket(self, items):
        return _ast.Subscript(
            value=items[0],
            slice=items[1]
        )

    def rest_accessor(self, items):
        return _ast.Call(
            func=_ast.Name(id='deepcopy', ctx=ast.Load()),
            args=[
                items[0],
            ],
            keywords=[]
        )

    def reassign(self, items):
        return self.declare_var([None, None, items[0], items[1]])

    def _function(self, items, type=None):

        _constructor = _ast.AsyncFunctionDef if type == "async" else _ast.FunctionDef

        (export, name,  generic_type, func_args, ret_type, body) = items

        self.logger.debug("_function", name, func_args, body)

        kwargs = {
            "name": name.id,
            "body": self._adapt_body(body),
            "args": func_args,
            "decorator_list": []
        }

        ret = _constructor(** kwargs)

        # Register the Function.
        self._anonymous_func_to_ids[ret] = name
        self._ids_to_anonymous_func[name] = ret
        # self._anonymous_func_tree[ret] = name

        return ret

    def function(self, items):
        self.log("function", items)

        return self._function(items)

    def async_function(self, items):
        self.log("async_function", items)

        return self._function(items, "async")

    def _arrow_function(self, items, type=None):
        self.log("_arrow_function", items)
        print(items)

        # TODO: Get name for callback
        name = _ast.Name(id=self._get_func_name())
        return self._function([None, name, *items], type)

    def arrow_function(self, items):
        self.log("arrow_function", items)

        return self._arrow_function(items)

    def arrow_function_one_arg(self, items):
        self.log("arrow_function", items)

        return self._arrow_function(items)

    def async_arrow_function(self, items):
        self.log("async_arrow_function", items)

        return self._arrow_function(items, "async")

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

        return _ast.arguments(**ret)

    def func_arg(self, items):
        return items

    def default_func_arg(self, items):

        self.log("default_func_arg", items)
        # TODO: Implement
        return {
            "args":    [_ast.arg(arg=items[0].id)],
            "defaults": [],
            "vararg": []
        }

    def rest_func_arg(self, items):
        self.log("rest_func_arg", items)
        return {
            "vararg": [_ast.arg(arg=items[0].id)],
            "args": [],
            "defaults": []
        }

    def assigend_func_arg(self, items):

        self.log("assigend_func_arg", items)
        return {
            "args":    [_ast.arg(arg=items[0].id)],
            "defaults": [items[1]],
            "vararg": []
        }

    def implicit_or_typed(self, items):
        return items[0]

    def func_body(self, items):

        ret = []
        elements = items[0]

        self.log("func_body", elements)

        for element in elements:
            if type(element) is list:
                ret += element
            else:
                ret.append(element)

        return ret

    def func_statements(self, items):
        return items

    def func_statement(self, items):
        return items

    def function_call(self, items):

        self.log("function_call", items)

        id = items[0]
        args = items[-1] if items[-1] is not None else []

        # Adapt the ID:
        if type(id) is _ast.Name:
            id = id

        ret = _ast.Call(
            func=id,
            args=self._adapt_items(args),
            keywords=[]
        )

        return _ast.Call(
            func=id,
            args=self._adapt_items(args),
            keywords=[]
        )

    def call_args(self, items):
        self.log("call_args", items)
        return items

    def call_arg(self, items):
        self.log("call_arg", items)
        return items[0]

    def rest_call_arg(self, items):
        return _ast.Starred(
            value=items[0]
        )

    def default_for(self, items):
        pass

    def multi_for(self, items):
        pass

    def ranged_for(self, items):
        pass

    def for_iter_type(self, items):
        pass

    def for_iter_var(self, items):
        pass

    def while_statement(self, items):
        self.log("while_statement", items)
        self.logger.debug(items[0])
        self.logger.debug(items[1])
        return _ast.While(
            test=items[0],
            body=self._adapt_body(
                items[1] if type(items) == list else [items[1]]
            ),
            orelse=[]
        )

    def iter_body(self, items):
        self.log("iter_body", items)

        if items[0] is None:
            return []

        return items[0]

    def iter_statements(self, items):
        return items

    def iter_statement(self, items):
        return items[0]

    def continue_statement(self, items):
        return _ast.Continue()

    def break_statement(self, items):
        return _ast.Break()

    def if_statement(self, items):

        test = items[0]
        body = items[1]
        elifs = items[2]
        else_body = items[3] if items[3] is not None else []

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

    def else_if_statements(self, items):
        return items

    def else_if_statement(self, items):
        return items

    def else_statement(self, items):
        return items[0]

    def if_body(self, items):
        return items

    def if_body_single(self, items):
        return items

    def inline_if(self, items):

        _items = self._adapt_items(items)

        ret = _ast.IfExp(
            test=_items[0],
            body=_items[1],
            orelse=_items[2]
        )

        self._add_to_tree(ret, _items)

        return ret

    def new_class(self, items):
        identifier = items[0]
        args = items[1] if items[1] is not None else []
        return _ast.Call(func=_ast.Name(id=identifier), args=args, keywords=[])

    def switch(self, items):
        raise Exception("!!SWITCH_CASE!!")
        return _ast.Constant(value="SWITCH")

    def switch_body(self, items):
        return _ast.Break()

    def switch_case(self, items):
        return _ast.Break()

    def switch_default(self, items):
        return _ast.Break()

    def switch_case_statements(self, items):
        return _ast.Break()

    def switch_case_statement(self, items):
        return _ast.Break()

    def try_catch(self, items):
        return _ast.Break()

    def try_catch_body(self, items):
        return

    def throw_statement(self, items):
        return _ast.Raise(
            exc=items[0]
        )

    def throw_error_statement(self, items):
        return _ast.Raise(
            exc=items[0]
        )


class DebuggedCodeTransformeTs(Transformer):
    def __init__(self, visit_tokens: bool = True) -> None:
        super().__init__(visit_tokens)

        self.logger = get_logger("DebugWrapper")

    def __getattribute__(self, __name: str):
        logger = object.__getattribute__(self, "logger")

        try:
            func = object.__getattribute__(self, __name)

            if callable(func):

                def cb(items):
                    logger.info(f"Calling function '{__name}'")
                    try:
                        logger.info(f"received parameters => {len(items)}")
                    except:
                        pass
                    return func(items)

                return cb

            return func
        except:
            pass

        logger.warn(f"'{__name}' has not been found!")
        raise KeyError(f"'{__name}' has not been found!")


def transform(tree, debug, to_snake_case):
    transformer = CodeTransformeTs(
        True, logging.DEBUG if debug else logging.INFO)
    program = transformer.transform(tree)

    if debug:
        print(ast.dump(program, indent=2))

    code = astor.to_source(program)

    if debug:
        print(code)
    return code
