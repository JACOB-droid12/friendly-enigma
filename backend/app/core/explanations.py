def educational_notes() -> list[str]:
    return [
        "Interpolation constructs a polynomial that passes through the supplied nodes.",
        "For n + 1 distinct x-values, the interpolating polynomial is unique.",
        "Distinct x-values are required because repeated x-values make formulas divide by zero.",
        "Lagrange form is useful for showing basis polynomials and the interpolation formula.",
        "Newton form is useful for divided-difference tables and adding nodes.",
        "Barycentric form is preferred as the default numerical evaluator for values and graphing.",
        "Neville's method is useful when only a target-specific value is needed.",
    ]
