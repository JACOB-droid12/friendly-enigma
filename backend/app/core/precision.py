from decimal import Decimal, InvalidOperation, localcontext
from typing import Any

import mpmath as mp
import sympy as sp

from app.core.errors import InterpolationError


def parse_numeric_string(value: str, *, exact: bool, precision: int) -> sp.Expr | mp.mpf:
    text = value.strip()
    if not text:
        raise InterpolationError("non_real_value", "Numeric value cannot be empty.")
    try:
        if exact:
            return sp.Rational(text)
        with mp.workdps(precision):
            return mp.mpf(text)
    except (TypeError, ValueError, InvalidOperation, sp.SympifyError) as exc:
        raise InterpolationError(
            "non_real_value",
            "Numeric values must be real numeric strings.",
            {"value": value},
        ) from exc


def to_sympy(value: sp.Expr | mp.mpf | str, *, exact: bool, precision: int) -> sp.Expr:
    if isinstance(value, sp.Basic):
        return value
    if isinstance(value, str):
        parsed = parse_numeric_string(value, exact=exact, precision=precision)
        if isinstance(parsed, sp.Basic):
            return parsed
        return sp.Float(mp.nstr(parsed, n=precision), precision)
    return sp.Float(mp.nstr(value, n=precision), precision)


def _trim_decimal_text(text: str) -> str:
    if "e" in text.lower():
        return text.replace("e+", "e")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def format_value(value: Any, *, precision: int) -> str | None:
    if value is None:
        return None
    if isinstance(value, sp.Basic):
        simplified = sp.simplify(value)
        if simplified.is_Integer:
            return str(int(simplified))
        if simplified.is_Rational:
            return str(simplified)
        numeric = sp.N(simplified, precision)
        return _trim_decimal_text(str(numeric))
    if isinstance(value, mp.mpf):
        return _trim_decimal_text(mp.nstr(value, n=precision, strip_zeros=False))
    with localcontext() as ctx:
        ctx.prec = max(precision, 8)
        return _trim_decimal_text(format(Decimal(str(value)), "f"))


def format_decimal(value: Any, *, precision: int) -> str | None:
    if value is None:
        return None
    if isinstance(value, sp.Basic):
        numeric = sp.N(value, precision)
        return _trim_decimal_text(str(numeric))
    return format_value(value, precision=precision)


def comparison_tolerances(precision: int) -> dict[str, int | str]:
    comparison_digits = max(8, precision)
    exponent = -(comparison_digits - 4)
    tol = f"1e{exponent}"
    return {
        "abs_tol": tol,
        "rel_tol": tol,
        "precision_digits_used_for_comparison": comparison_digits,
    }


def _to_mpf(value: Any, *, precision: int) -> mp.mpf:
    with mp.workdps(max(precision, 20)):
        if isinstance(value, sp.Basic):
            return mp.mpf(str(sp.N(value, precision)))
        if isinstance(value, str):
            try:
                return mp.mpf(value)
            except ValueError:
                return mp.mpf(str(sp.N(sp.Rational(value), precision)))
        return mp.mpf(str(value))


def values_close(left: Any, right: Any, *, precision: int) -> bool:
    tolerances = comparison_tolerances(precision)
    with mp.workdps(max(precision, 20)):
        a = _to_mpf(left, precision=precision)
        b = _to_mpf(right, precision=precision)
        abs_tol = mp.mpf(str(tolerances["abs_tol"]))
        rel_tol = mp.mpf(str(tolerances["rel_tol"]))
        diff = abs(a - b)
        return diff <= abs_tol or diff <= rel_tol * max(mp.mpf("1"), abs(a), abs(b))
