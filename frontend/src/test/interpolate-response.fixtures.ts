import type { InterpolateResponse } from "@/lib/api-types"

export const linearPointsResponse = {
  status: "ok",
  response_version: "1.0",
  metadata: {
    tolerance: {
      abs_tol: "1e-46",
      rel_tol: "1e-46",
      precision_digits_used_for_comparison: 50,
    },
  },
  input_summary: {
    mode: "points",
    node_count: 2,
    degree: 1,
    methods_requested: ["lagrange", "newton", "barycentric", "neville"],
    precision: 50,
    exact: true,
    function_known: false,
    graph_requested: true,
    sorted_nodes: false,
  },
  nodes: [
    { index: 0, x: "2", y: "4" },
    { index: 1, x: "5", y: "1" },
  ],
  degree: 1,
  polynomial: {
    expanded: "6 - x",
    factored: "6 - x",
    lagrange_form: "4*(5/3 - x/3) + x/3 - 2/3",
    newton_form: "4 + (x - 2)*(-1)",
    hermite_form: null,
    taylor_form: null,
    latex_expanded: "6 - x",
    latex_lagrange: "4 \\left(\\frac{5}{3} - \\frac{x}{3}\\right) + \\frac{x}{3} - \\frac{2}{3}",
    latex_newton: "4 - x + 2",
    latex_hermite: null,
    latex_taylor: null,
    expanded_omitted_reason: null,
  },
  methods: {
    lagrange: {
      status: "ok",
      basis_polynomials: [
        {
          index: 0,
          x_i: "2",
          basis: "5/3 - x/3",
          expanded: "5/3 - x/3",
          latex: "\\frac{5}{3} - \\frac{x}{3}",
        },
        {
          index: 1,
          x_i: "5",
          basis: "x/3 - 2/3",
          expanded: "x/3 - 2/3",
          latex: "\\frac{x}{3} - \\frac{2}{3}",
        },
      ],
      summation_form: "4*(5/3 - x/3) + x/3 - 2/3",
      expanded: "6 - x",
      latex_expanded: "6 - x",
      latex_lagrange: "4 \\left(\\frac{5}{3} - \\frac{x}{3}\\right) + \\frac{x}{3} - \\frac{2}{3}",
      evaluations: [{ x: "3", value: "3" }],
      steps: [
        "Build each Lagrange basis polynomial so it is 1 at its own node and 0 at other nodes.",
      ],
      warnings: [],
      error: null,
    },
    newton: {
      status: "ok",
      divided_difference_table: [
        ["4", "-1"],
        ["1", null],
      ],
      coefficients: ["4", "-1"],
      nested_form: "4 + (x - 2)*(-1)",
      expanded: "6 - x",
      latex_expanded: "6 - x",
      latex_newton: "4 - x + 2",
      evaluations: [{ x: "3", value: "3" }],
      steps: ["Build the divided-difference table."],
      warnings: [],
      error: null,
    },
    barycentric: {
      status: "ok",
      weights: [
        { index: 0, x: "2", weight: "-1/3" },
        { index: 1, x: "5", weight: "1/3" },
      ],
      evaluations: [{ x: "3", value: "3" }],
      notes: ["Barycentric form is used for stable numerical evaluation."],
      warnings: [],
      error: null,
    },
    neville: {
      status: "ok",
      target_results: [{ x: "3", value: "3" }],
      tables: [
        {
          x: "3",
          rows: [
            ["4", "3"],
            ["1", null],
          ],
        },
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "3",
      best_P_x: "3",
      best_method: "barycentric",
      method_values: {
        lagrange: "3",
        newton: "3",
        barycentric: "3",
        neville: "3",
      },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: {
    x: ["2", "3", "5"],
    f_x: [null, null, null],
    P_x: ["4", "3", "1"],
    error: [null, null, null],
    source_method: "barycentric",
    method_graphs: null,
  },
  warnings: [],
  educational_notes: ["The backend is the source of truth for all interpolation values."],
} satisfies InterpolateResponse

export const oneOverXResponse = {
  ...linearPointsResponse,
  input_summary: {
    ...linearPointsResponse.input_summary,
    mode: "x_values_with_function",
    node_count: 3,
    degree: 2,
    function_known: true,
    graph_requested: false,
  },
  nodes: [
    { index: 0, x: "2", y: "1/2" },
    { index: 1, x: "2.75", y: "4/11" },
    { index: 2, x: "4", y: "1/4" },
  ],
  degree: 2,
  methods: {
    ...linearPointsResponse.methods,
    neville: {
      status: "ok",
      target_results: [{ x: "3", value: "29/88" }],
      tables: [
        {
          x: "3",
          rows: [
            ["1/2", "1/3", "29/88"],
            ["4/11", "16/55", null],
            ["1/4", null, null],
          ],
        },
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "3",
      best_P_x: "29/88",
      best_method: "barycentric",
      method_values: {
        lagrange: "29/88",
        newton: "29/88",
        barycentric: "29/88",
        neville: "29/88",
      },
      f_x: "1/3",
      absolute_error: "1/264",
      warnings: [],
    },
  ],
  graph_data: null,
} satisfies InterpolateResponse

// ---------------------------------------------------------------------------
// Phase 2 — Equal-Spacing Family fixtures
//
// Per design.md §12.1. Sourced from docs/API_CONTRACT.md
// "P2.1 Equal-Spacing Methods" example payloads. Lecture data: cos(x) at
// x = 1, 1.3, 1.6, 1.9, 2.2 (= 1, 13/10, 8/5, 19/10, 11/5), evaluation x = 1.5.
//
// Numeric string values inside `forward_difference_table`,
// `backward_difference_table`, `centered_difference_table`, `evaluations[].value`,
// and `terms[].value` are illustrative shapes that look like real backend
// strings; they are NOT derived from running the backend. They exist to lock
// the response *shape* against the type so contract drift is caught at
// compile time. Frontend renderers must continue to read these as opaque
// backend strings (R1.4) without re-deriving them. Field names match the
// contract verbatim (R2.6).
// ---------------------------------------------------------------------------

const equalSpacingTolerance = {
  abs_tol: "1e-46",
  rel_tol: "1e-46",
  precision_digits_used_for_comparison: 50,
}

const equalSpacingNodes = [
  { index: 0, x: "1", y: "27015115/50000000" },
  { index: 1, x: "13/10", y: "1337494/5000000" },
  { index: 2, x: "8/5", y: "-1459976/50000000" },
  { index: 3, x: "19/10", y: "-1616448/5000000" },
  { index: 4, x: "11/5", y: "-29425056/50000000" },
]

const equalSpacingPolynomial = {
  expanded: null,
  factored: null,
  lagrange_form: null,
  newton_form: null,
  hermite_form: null,
  taylor_form: null,
  latex_expanded: null,
  latex_lagrange: null,
  latex_newton: null,
  latex_hermite: null,
  latex_taylor: null,
  expanded_omitted_reason: null,
}

const equalSpacingTargetGuidance = {
  recommended: "stirling",
  target: "3/2",
  left: "1",
  right: "11/5",
  midpoint: "8/5",
}

export const newtonForwardResponse = {
  status: "ok",
  response_version: "1.0",
  metadata: { tolerance: equalSpacingTolerance },
  input_summary: {
    mode: "x_values_with_function",
    node_count: 5,
    degree: 4,
    methods_requested: ["newton_forward"],
    precision: 50,
    exact: true,
    function_known: true,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: equalSpacingNodes,
  degree: 4,
  polynomial: equalSpacingPolynomial,
  methods: {
    newton_forward: {
      status: "ok",
      forward_difference_table: [
        [
          "27015115/50000000",
          "1337494/5000000",
          "-1459976/50000000",
          "-1616448/5000000",
          "-29425056/50000000",
        ],
        [
          "-1364017/5000000",
          "-2825470/10000000",
          "-2671472/10000000",
          "-2270306/10000000",
          null,
        ],
        [
          "-97436/10000000",
          "153998/10000000",
          "401166/10000000",
          null,
          null,
        ],
        [
          "251434/10000000",
          "247168/10000000",
          null,
          null,
          null,
        ],
        [
          "-4266/10000000",
          null,
          null,
          null,
          null,
        ],
      ],
      spacing_h: "3/10",
      anchor_index: 0,
      evaluations: [
        {
          x: "3/2",
          s: "5/3",
          value: "70737201667702910/1000000000000000000",
          terms: [
            { order: 0, value: "27015115/50000000" },
            { order: 1, value: "-2273361/5000000" },
            { order: 2, value: "108262/10000000" },
            { order: 3, value: "-46562/10000000" },
            { order: 4, value: "237/10000000" },
          ],
          target_guidance: equalSpacingTargetGuidance,
        },
      ],
      steps: [
        "Build the forward-difference table from the equally spaced node values.",
        "Apply Newton's forward formula at s = (x - x_0) / h.",
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "3/2",
      best_P_x: "70737201667702910/1000000000000000000",
      best_method: "newton_forward",
      method_values: {
        newton_forward: "70737201667702910/1000000000000000000",
      },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

export const newtonBackwardResponse = {
  status: "ok",
  response_version: "1.0",
  metadata: { tolerance: equalSpacingTolerance },
  input_summary: {
    mode: "x_values_with_function",
    node_count: 5,
    degree: 4,
    methods_requested: ["newton_backward"],
    precision: 50,
    exact: true,
    function_known: true,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: equalSpacingNodes,
  degree: 4,
  polynomial: equalSpacingPolynomial,
  methods: {
    newton_backward: {
      status: "ok",
      backward_difference_table: [
        [
          "27015115/50000000",
          "1337494/5000000",
          "-1459976/50000000",
          "-1616448/5000000",
          "-29425056/50000000",
        ],
        [
          null,
          "-1364017/5000000",
          "-2825470/10000000",
          "-2671472/10000000",
          "-2270306/10000000",
        ],
        [
          null,
          null,
          "-97436/10000000",
          "153998/10000000",
          "401166/10000000",
        ],
        [
          null,
          null,
          null,
          "251434/10000000",
          "247168/10000000",
        ],
        [
          null,
          null,
          null,
          null,
          "-4266/10000000",
        ],
      ],
      spacing_h: "3/10",
      anchor_index: 4,
      evaluations: [
        {
          x: "3/2",
          s: "-7/3",
          value: "70737201667702910/1000000000000000000",
          terms: [
            { order: 0, value: "-29425056/50000000" },
            { order: 1, value: "529738/10000000" },
            { order: 2, value: "-218763/10000000" },
            { order: 3, value: "-25928/10000000" },
            { order: 4, value: "237/10000000" },
          ],
          target_guidance: equalSpacingTargetGuidance,
        },
      ],
      steps: [
        "Build the backward-difference table from the equally spaced node values.",
        "Apply Newton's backward formula at s = (x - x_n) / h.",
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "3/2",
      best_P_x: "70737201667702910/1000000000000000000",
      best_method: "newton_backward",
      method_values: {
        newton_backward: "70737201667702910/1000000000000000000",
      },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

export const stirlingResponse = {
  status: "ok",
  response_version: "1.0",
  metadata: { tolerance: equalSpacingTolerance },
  input_summary: {
    mode: "x_values_with_function",
    node_count: 5,
    degree: 4,
    methods_requested: ["stirling"],
    precision: 50,
    exact: true,
    function_known: true,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: equalSpacingNodes,
  degree: 4,
  polynomial: equalSpacingPolynomial,
  methods: {
    stirling: {
      status: "ok",
      centered_difference_table: [
        [
          "27015115/50000000",
          "1337494/5000000",
          "-1459976/50000000",
          "-1616448/5000000",
          "-29425056/50000000",
        ],
        [
          null,
          "-1364017/5000000",
          "-2825470/10000000",
          "-2671472/10000000",
          null,
        ],
        [
          null,
          "-97436/10000000",
          "153998/10000000",
          "401166/10000000",
          null,
        ],
        [
          null,
          null,
          "251434/10000000",
          "247168/10000000",
          null,
        ],
        [
          null,
          null,
          "-4266/10000000",
          null,
          null,
        ],
      ],
      spacing_h: "3/10",
      center_index: 2,
      center_x: "8/5",
      evaluations: [
        {
          x: "3/2",
          s: "-1/3",
          value: "70737201667702910/1000000000000000000",
          terms: [
            { order: 0, value: "-1459976/50000000" },
            { order: 1, value: "915824/10000000" },
            { order: 2, value: "-8551/10000000" },
            { order: 3, value: "-13851/10000000" },
            { order: 4, value: "-30/10000000" },
          ],
          target_guidance: equalSpacingTargetGuidance,
        },
      ],
      steps: [
        "Build the centered-difference table around the middle node.",
        "Apply Stirling's centered formula at s = (x - x_center) / h.",
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "3/2",
      best_P_x: "70737201667702910/1000000000000000000",
      best_method: "stirling",
      method_values: {
        stirling: "70737201667702910/1000000000000000000",
      },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

// ---------------------------------------------------------------------------
// Phase 2 — Derivative-Data Family fixtures (Hermite)
//
// Per design.md §12.1 and tasks.md task 6.2. Sourced from
// docs/API_CONTRACT.md "P2.2 Derivative-Data Methods" example payloads.
// Lecture data: f(x) = cos(x) sampled at the Bessel-style nodes
// x = 1.3, 1.6, 1.9 (= 13/10, 8/5, 19/10) with first derivatives
// f'(1.3) ≈ -0.52202324741466, f'(1.6) ≈ -0.56989593526168,
// f'(1.9) ≈ -0.581157072713434, evaluation x = 1.5 (= 3/2). Three source
// nodes each repeated twice gives six repeated nodes and a Hermite
// polynomial of degree 5, which is small enough that the backend keeps
// the explicit basis form `included` in `hermiteResponse`.
//
// Numeric string values inside `repeated_nodes`,
// `divided_difference_table`, `coefficients`, `nested_form`, `expanded`,
// `latex_expanded`, `latex_hermite`, `evaluations[].value`, the
// per-term `lagrange_basis` / `value_basis` / `derivative_basis`, and
// the basis-form `expanded` / `latex` fields are illustrative shapes
// that look like real backend strings; they are NOT derived from
// running the backend. They exist to lock the response *shape* against
// the type so contract drift is caught at compile time. Frontend
// renderers must continue to read these as opaque backend strings
// (R1.4) without re-deriving them. Field names match the contract
// verbatim (R2.6). Per locked decision 2 the omitted basis-form shape
// carries only `status: "omitted"`; the omission is surfaced via the
// `expanded_polynomial_omitted` warning whose
// `details.artifact === "hermite_basis_form"`.
// ---------------------------------------------------------------------------

const hermiteTolerance = {
  abs_tol: "1e-46",
  rel_tol: "1e-46",
  precision_digits_used_for_comparison: 50,
}

const hermiteNodes = [
  { index: 0, x: "13/10", y: "310043/500000" },
  { index: 1, x: "8/5", y: "2277011/5000000" },
  { index: 2, x: "19/10", y: "1409093/5000000" },
]

const hermitePolynomial = {
  expanded: "511787/1000000",
  factored: null,
  lagrange_form: null,
  newton_form: null,
  hermite_form:
    "310043/500000 + (-26101162370733/50000000000000)*(x - 13/10) + (-26749/100000)*(x - 13/10)**2 + (-3517/100000)*(x - 13/10)**2*(x - 8/5) + (1893/1000000)*(x - 13/10)**2*(x - 8/5)**2 + (-241/1000000)*(x - 13/10)**2*(x - 8/5)**2*(x - 19/10)",
  taylor_form: null,
  latex_expanded: "0.511787",
  latex_lagrange: null,
  latex_newton: null,
  latex_hermite:
    "H(x) = 0.620086 - 0.522023\\,(x - 1.3) - 0.26749\\,(x - 1.3)^{2} + \\dots",
  latex_taylor: null,
  expanded_omitted_reason: null,
}

const hermiteRepeatedNodes = [
  {
    index: 0,
    source_node_index: 0,
    x: "13/10",
    y: "310043/500000",
    first_derivative: "-26101162370733/50000000000000",
  },
  {
    index: 1,
    source_node_index: 0,
    x: "13/10",
    y: "310043/500000",
    first_derivative: "-26101162370733/50000000000000",
  },
  {
    index: 2,
    source_node_index: 1,
    x: "8/5",
    y: "2277011/5000000",
    first_derivative: "-28494796763084/50000000000000",
  },
  {
    index: 3,
    source_node_index: 1,
    x: "8/5",
    y: "2277011/5000000",
    first_derivative: "-28494796763084/50000000000000",
  },
  {
    index: 4,
    source_node_index: 2,
    x: "19/10",
    y: "1409093/5000000",
    first_derivative: "-290578536356717/500000000000000",
  },
  {
    index: 5,
    source_node_index: 2,
    x: "19/10",
    y: "1409093/5000000",
    first_derivative: "-290578536356717/500000000000000",
  },
]

const hermiteDividedDifferenceTable = [
  [
    "310043/500000",
    "-26101162370733/50000000000000",
    "-26749/100000",
    "-3517/100000",
    "1893/1000000",
    "-241/1000000",
  ],
  [
    "310043/500000",
    "-2624867/5000000",
    "-31043/100000",
    "-3404/100000",
    "1751/1000000",
    null,
  ],
  [
    "2277011/5000000",
    "-28494796763084/50000000000000",
    "-34218/100000",
    "-3017/100000",
    null,
    null,
  ],
  [
    "2277011/5000000",
    "-2904184/5000000",
    "-37123/100000",
    null,
    null,
    null,
  ],
  [
    "1409093/5000000",
    "-290578536356717/500000000000000",
    null,
    null,
    null,
    null,
  ],
  ["1409093/5000000", null, null, null, null, null],
]

const hermiteCoefficients = [
  "310043/500000",
  "-26101162370733/50000000000000",
  "-26749/100000",
  "-3517/100000",
  "1893/1000000",
  "-241/1000000",
]

const hermiteNestedForm =
  "((((((-241/1000000)*(x - 19/10) + 1893/1000000)*(x - 8/5) + (-3517/100000))*(x - 8/5) + (-26749/100000))*(x - 13/10) + (-26101162370733/50000000000000))*(x - 13/10) + 310043/500000)"

const hermiteEvaluations = [{ x: "3/2", value: "511787/1000000" }]

export const hermiteDividedDifferenceResponse = {
  status: "ok",
  response_version: "1.0",
  metadata: { tolerance: hermiteTolerance },
  input_summary: {
    mode: "points",
    node_count: 3,
    degree: 5,
    methods_requested: ["hermite_divided_difference"],
    precision: 50,
    exact: true,
    function_known: false,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: hermiteNodes,
  degree: 5,
  polynomial: hermitePolynomial,
  methods: {
    hermite_divided_difference: {
      status: "ok",
      repeated_nodes: hermiteRepeatedNodes,
      divided_difference_table: hermiteDividedDifferenceTable,
      coefficients: hermiteCoefficients,
      nested_form: hermiteNestedForm,
      expanded: hermitePolynomial.hermite_form,
      latex_expanded: hermitePolynomial.latex_expanded,
      latex_hermite: hermitePolynomial.latex_hermite,
      evaluations: hermiteEvaluations,
      steps: [
        "Repeat each node according to the highest derivative order supplied (here, order = 1 so each node appears twice).",
        "Build the Hermite divided-difference table; entries on the repeated diagonal use the supplied first derivatives.",
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "3/2",
      best_P_x: "511787/1000000",
      best_method: "hermite_divided_difference",
      method_values: {
        hermite_divided_difference: "511787/1000000",
      },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

export const hermiteResponse = {
  ...hermiteDividedDifferenceResponse,
  input_summary: {
    ...hermiteDividedDifferenceResponse.input_summary,
    methods_requested: ["hermite"],
  },
  methods: {
    hermite: {
      status: "ok",
      repeated_nodes: hermiteRepeatedNodes,
      divided_difference_table: hermiteDividedDifferenceTable,
      coefficients: hermiteCoefficients,
      nested_form: hermiteNestedForm,
      expanded: hermitePolynomial.hermite_form,
      latex_expanded: hermitePolynomial.latex_expanded,
      latex_hermite: hermitePolynomial.latex_hermite,
      evaluations: hermiteEvaluations,
      steps: [
        "Build the Hermite polynomial directly from the basis-form expression so the basis terms can be inspected alongside the divided-difference construction.",
      ],
      warnings: [],
      error: null,
      basis_form: {
        status: "included" as const,
        formula:
          "H_i(x) = (1 - 2*(x - x_i)*L_i'(x_i))*L_i(x)**2, K_i(x) = (x - x_i)*L_i(x)**2",
        terms: [
          {
            node_index: 0,
            x: "13/10",
            f_x: "310043/500000",
            f_prime_x: "-26101162370733/50000000000000",
            lagrange_basis: "(x - 8/5)*(x - 19/10)/((13/10 - 8/5)*(13/10 - 19/10))",
            value_basis:
              "(1 - 2*(x - 13/10)*(-25/3))*((x - 8/5)*(x - 19/10)/((-3/10)*(-3/5)))**2",
            derivative_basis:
              "(x - 13/10)*((x - 8/5)*(x - 19/10)/((-3/10)*(-3/5)))**2",
          },
          {
            node_index: 1,
            x: "8/5",
            f_x: "2277011/5000000",
            f_prime_x: "-28494796763084/50000000000000",
            lagrange_basis: "(x - 13/10)*(x - 19/10)/((8/5 - 13/10)*(8/5 - 19/10))",
            value_basis:
              "(1 - 2*(x - 8/5)*0)*((x - 13/10)*(x - 19/10)/((3/10)*(-3/10)))**2",
            derivative_basis:
              "(x - 8/5)*((x - 13/10)*(x - 19/10)/((3/10)*(-3/10)))**2",
          },
          {
            node_index: 2,
            x: "19/10",
            f_x: "1409093/5000000",
            f_prime_x: "-290578536356717/500000000000000",
            lagrange_basis: "(x - 13/10)*(x - 8/5)/((19/10 - 13/10)*(19/10 - 8/5))",
            value_basis:
              "(1 - 2*(x - 19/10)*(25/3))*((x - 13/10)*(x - 8/5)/((3/5)*(3/10)))**2",
            derivative_basis:
              "(x - 19/10)*((x - 13/10)*(x - 8/5)/((3/5)*(3/10)))**2",
          },
        ],
        expanded: hermitePolynomial.hermite_form,
        latex: hermitePolynomial.latex_hermite,
        matches_divided_difference: true,
      },
    },
  },
  evaluations: [
    {
      x: "3/2",
      best_P_x: "511787/1000000",
      best_method: "hermite",
      method_values: { hermite: "511787/1000000" },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
} satisfies InterpolateResponse

export const hermiteOmittedBasisResponse = {
  ...hermiteResponse,
  methods: {
    hermite: {
      ...hermiteResponse.methods.hermite,
      basis_form: { status: "omitted" as const },
      warnings: [
        {
          code: "expanded_polynomial_omitted",
          message:
            "Hermite basis form was omitted because the symbolic basis expansion exceeded the display threshold.",
          details: { artifact: "hermite_basis_form" },
        },
      ],
    },
  },
  warnings: [
    {
      code: "expanded_polynomial_omitted",
      message:
        "Hermite basis form was omitted because the symbolic basis expansion exceeded the display threshold.",
      details: { artifact: "hermite_basis_form" },
    },
  ],
} satisfies InterpolateResponse

// ---------------------------------------------------------------------------
// Phase 2 — Function-Derivative Family fixtures (Taylor)
//
// Per design.md §12.1 and tasks.md task 6.3. Sourced from
// docs/API_CONTRACT.md "P2.3 Taylor Method" example payload. Lecture
// data: f(x) = cos(x), center 0, order 3, x_values = ["0", "1"],
// evaluation x = 1/2. center === "0" implies the backend reports
// `series_name === "Maclaurin"`. The Maclaurin polynomial of cos(x)
// truncated at order 3 is 1 - x**2/2 (the order-1 and order-3 terms
// vanish), and 1 - (1/2)**2/2 = 7/8 at x = 1/2.
//
// Numeric string values inside `methods.taylor.terms[]`,
// `methods.taylor.taylor_form`, `methods.taylor.expanded`,
// `methods.taylor.latex_*`, `methods.taylor.evaluations[].value`,
// `polynomial.taylor_form`, `polynomial.expanded`,
// `polynomial.latex_*`, and the cos(1) node y-value are illustrative
// shapes that look like real backend strings; they are NOT derived
// from running the backend. They exist to lock the response *shape*
// against the type so contract drift is caught at compile time.
// Frontend renderers must continue to read these as opaque backend
// strings (R1.4) without re-deriving them. Field names match the
// contract verbatim (R2.6). The error-case fixture mirrors the live
// backend convention of OMITTING every collection / scalar method-
// level field on a `status: "error"` result; only `status`,
// `warnings`, and `error` are present, matching the runtime
// optional-fields contract encoded in `api-types.ts` so renderers
// fall through to the shared `ErrorNotice` path (R8.4).
// ---------------------------------------------------------------------------

const taylorTolerance = {
  abs_tol: "1e-46",
  rel_tol: "1e-46",
  precision_digits_used_for_comparison: 50,
}

const taylorNodes = [
  { index: 0, x: "0", y: "1" },
  { index: 1, x: "1", y: "5403023058681398/10000000000000000" },
]

const taylorPolynomial = {
  expanded: "1 - x**2/2",
  factored: null,
  lagrange_form: null,
  newton_form: null,
  hermite_form: null,
  taylor_form: "1 - x**2/2",
  latex_expanded: "1 - \\frac{x^{2}}{2}",
  latex_lagrange: null,
  latex_newton: null,
  latex_hermite: null,
  latex_taylor: "1 - \\frac{x^{2}}{2}",
  expanded_omitted_reason: null,
}

const taylorErrorPolynomial = {
  expanded: null,
  factored: null,
  lagrange_form: null,
  newton_form: null,
  hermite_form: null,
  taylor_form: null,
  latex_expanded: null,
  latex_lagrange: null,
  latex_newton: null,
  latex_hermite: null,
  latex_taylor: null,
  expanded_omitted_reason: null,
}

export const taylorResponse = {
  status: "ok",
  response_version: "1.0",
  metadata: { tolerance: taylorTolerance },
  input_summary: {
    mode: "x_values_with_function",
    node_count: 2,
    degree: 3,
    methods_requested: ["taylor"],
    precision: 50,
    exact: true,
    function_known: true,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: taylorNodes,
  degree: 3,
  polynomial: taylorPolynomial,
  methods: {
    taylor: {
      status: "ok",
      center: "0",
      order: 3,
      series_name: "Maclaurin",
      terms: [
        {
          order: 0,
          derivative: "cos(x)",
          derivative_at_center: "1",
          coefficient: "1",
          term: "1",
          latex_term: "1",
        },
        {
          order: 1,
          derivative: "-sin(x)",
          derivative_at_center: "0",
          coefficient: "0",
          term: "0",
          latex_term: "0",
        },
        {
          order: 2,
          derivative: "-cos(x)",
          derivative_at_center: "-1",
          coefficient: "-1/2",
          term: "-x**2/2",
          latex_term: "- \\frac{x^{2}}{2}",
        },
        {
          order: 3,
          derivative: "sin(x)",
          derivative_at_center: "0",
          coefficient: "0",
          term: "0",
          latex_term: "0",
        },
      ],
      taylor_form: "1 - x**2/2",
      expanded: "1 - x**2/2",
      latex_expanded: "1 - \\frac{x^{2}}{2}",
      latex_taylor: "1 - \\frac{x^{2}}{2}",
      evaluations: [{ x: "1/2", value: "7/8" }],
      remainder_note:
        "Taylor's theorem writes f(x) = P_n(x) + R_n(x), where R_n(x) = f^{(n+1)}(c) * (x - center)^{n+1} / (n+1)! for some c between center and x.",
      steps: [
        "Differentiate f(x) up to the requested order at the chosen center.",
        "Combine the derivative values into the Taylor coefficients and assemble the polynomial.",
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "1/2",
      best_P_x: "7/8",
      best_method: "taylor",
      method_values: { taylor: "7/8" },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

export const taylorUnsupportedFunctionResponse = {
  status: "partial",
  response_version: "1.0",
  metadata: { tolerance: taylorTolerance },
  input_summary: {
    mode: "x_values_with_function",
    node_count: 0,
    degree: 0,
    methods_requested: ["taylor"],
    precision: 50,
    exact: true,
    function_known: true,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: [],
  degree: 0,
  polynomial: taylorErrorPolynomial,
  methods: {
    taylor: {
      status: "error",
      warnings: [],
      error: {
        code: "unsupported_taylor_function",
        message:
          "Taylor expansion is not supported for this function or center; the safe parser could not produce finite, real derivative terms.",
        details: {},
      },
    },
  },
  evaluations: [],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

// ---------------------------------------------------------------------------
// Phase 2 — Piecewise Family fixtures (Cubic Spline)
//
// Per design.md §12.1 and tasks.md task 6.4. Sourced from
// docs/API_CONTRACT.md "P2.4 Natural Cubic Spline Method" example
// payload. Lecture data: three points (1, 2), (2, 3), (3, 5) with
// `boundary_condition: "natural"`, evaluation x = 5/2 inside segment 1,
// and `graph: true`. The unique natural cubic spline through these
// points solves M_0 = M_2 = 0 and continuity at x = 2; the standard
// solution gives M_1 = 3/2 with two segments over [1, 2] and [2, 3].
//
// Numeric string values inside `methods.cubic_spline.second_derivatives`,
// `methods.cubic_spline.segments[]` (`coefficients`, `local_form`,
// `expanded`, `latex`), `methods.cubic_spline.evaluations[].value`, the
// top-level `evaluations[].best_P_x`/`method_values`, and the
// `graph_data` `P_x` samples are illustrative shapes that look like
// real backend strings; they are NOT derived from running the backend.
// They exist to lock the response *shape* against the type so contract
// drift is caught at compile time. Frontend renderers must continue to
// read these as opaque backend strings (R1.4) without re-deriving them.
// Field names match the contract verbatim (R2.6). Per R9.3 a spline-
// only response sets `polynomial.expanded_omitted_reason` to
// `"piecewise_method_no_global_polynomial"`. The error fixture
// mirrors the live backend convention of OMITTING every collection /
// scalar method-level field on a `status: "error"` result; only
// `status`, `warnings`, and `error` are present, so renderers fall
// through to the shared `ErrorNotice` path (R9.5).
// ---------------------------------------------------------------------------

const cubicSplineTolerance = {
  abs_tol: "1e-46",
  rel_tol: "1e-46",
  precision_digits_used_for_comparison: 50,
}

const cubicSplineNodes = [
  { index: 0, x: "1", y: "2" },
  { index: 1, x: "2", y: "3" },
  { index: 2, x: "3", y: "5" },
]

const cubicSplinePiecewisePolynomial = {
  expanded: null,
  factored: null,
  lagrange_form: null,
  newton_form: null,
  hermite_form: null,
  taylor_form: null,
  latex_expanded: null,
  latex_lagrange: null,
  latex_newton: null,
  latex_hermite: null,
  latex_taylor: null,
  expanded_omitted_reason: "piecewise_method_no_global_polynomial",
}

const cubicSplineErrorPolynomial = {
  expanded: null,
  factored: null,
  lagrange_form: null,
  newton_form: null,
  hermite_form: null,
  taylor_form: null,
  latex_expanded: null,
  latex_lagrange: null,
  latex_newton: null,
  latex_hermite: null,
  latex_taylor: null,
  expanded_omitted_reason: null,
}

export const cubicSplineResponse = {
  status: "ok",
  response_version: "1.0",
  metadata: { tolerance: cubicSplineTolerance },
  input_summary: {
    mode: "points",
    node_count: 3,
    degree: 3,
    methods_requested: ["cubic_spline"],
    precision: 50,
    exact: true,
    function_known: false,
    graph_requested: true,
    sorted_nodes: false,
  },
  nodes: cubicSplineNodes,
  degree: 3,
  polynomial: cubicSplinePiecewisePolynomial,
  methods: {
    cubic_spline: {
      status: "ok",
      boundary_condition: "natural",
      ordered_nodes: cubicSplineNodes,
      second_derivatives: ["0", "3/2", "0"],
      segments: [
        {
          index: 0,
          interval: { left: "1", right: "2" },
          coefficients: { a: "2", b: "3/4", c: "0", d: "1/4" },
          local_form: "2 + 3/4*(x - 1) + 1/4*(x - 1)**3",
          expanded: "1 + 9*x/4 - 3*x**2/4 + x**3/4",
          latex: "2 + \\frac{3}{4}(x - 1) + \\frac{1}{4}(x - 1)^{3}",
        },
        {
          index: 1,
          interval: { left: "2", right: "3" },
          coefficients: { a: "3", b: "3/2", c: "3/4", d: "-1/4" },
          local_form: "3 + 3/2*(x - 2) + 3/4*(x - 2)**2 - 1/4*(x - 2)**3",
          expanded: "-5 + 27*x/4 - 15*x**2/4 + 3*x**3/4",
          latex:
            "3 + \\frac{3}{2}(x - 2) + \\frac{3}{4}(x - 2)^{2} - \\frac{1}{4}(x - 2)^{3}",
        },
      ],
      continuity_checks: [
        {
          x: "2",
          value_continuous: true,
          first_derivative_continuous: true,
          second_derivative_continuous: true,
        },
      ],
      evaluations: [
        { x: "5/2", value: "61/16", segment_index: 1 },
      ],
      steps: [
        "Solve the natural-spline tridiagonal system for the second derivatives M_i with M_0 = M_n = 0.",
        "Assemble each segment S_i(x) = a + b*(x - x_i) + c*(x - x_i)**2 + d*(x - x_i)**3 from the M_i values.",
      ],
      warnings: [],
      error: null,
    },
  },
  evaluations: [
    {
      x: "5/2",
      best_P_x: "61/16",
      best_method: "cubic_spline",
      method_values: { cubic_spline: "61/16" },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: {
    x: ["1", "3/2", "2", "5/2", "3"],
    f_x: [null, null, null, null, null],
    P_x: ["2", "21/16", "3", "61/16", "5"],
    error: [null, null, null, null, null],
    source_method: "cubic_spline",
    method_graphs: null,
  },
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

export const splineUnsupportedBoundaryResponse = {
  status: "partial",
  response_version: "1.0",
  metadata: { tolerance: cubicSplineTolerance },
  input_summary: {
    mode: "points",
    node_count: 3,
    degree: 0,
    methods_requested: ["cubic_spline"],
    precision: 50,
    exact: true,
    function_known: false,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: cubicSplineNodes,
  degree: 0,
  polynomial: cubicSplineErrorPolynomial,
  methods: {
    cubic_spline: {
      status: "error",
      warnings: [],
      error: {
        code: "unsupported_boundary_condition",
        message:
          "Boundary condition 'clamped' is not yet supported. Use 'natural'.",
        details: {},
      },
    },
  },
  evaluations: [],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

// ---------------------------------------------------------------------------
// Phase 2 — Deferred-Method fixture (Osculating sibling Lagrange)
//
// Per design.md §12.1 and tasks.md task 6.5. Sourced from
// docs/API_CONTRACT.md "P2.2 Derivative-Data Methods" deferred-osculating
// shape: when a request includes `osculating`, the backend returns a
// top-level `status: "partial"` response in which `methods.osculating`
// carries a method-level error with `error.code === "method_not_implemented"`
// while any sibling methods that did succeed still appear with their full
// happy-path payloads. This fixture pairs the deferred `osculating` entry
// with a successful `lagrange` sibling so the deferred-method renderer
// (D5) and method-tab dispatcher (D11 / D6) tests can assert that sibling
// visibility survives the partial status.
//
// Lecture data: the same Bessel-style nodes used by the Hermite fixtures
// — x = 1.3, 1.6, 1.9 with y = 0.6200860, 0.4554022, 0.2818186 — and a
// single evaluation x = 1.5. Numeric string values inside
// `polynomial.expanded`, `polynomial.lagrange_form`,
// `polynomial.latex_expanded`, `polynomial.latex_lagrange`, the
// `methods.lagrange` `basis_polynomials[]`, `summation_form`, `expanded`,
// `latex_expanded`, `latex_lagrange`, `evaluations[].value`, the top-
// level `evaluations[].best_P_x`/`method_values.lagrange`, and the
// `steps[]` strings are illustrative shapes that look like real backend
// strings; they are NOT derived from running the backend. They exist to
// lock the response *shape* against the type so contract drift is
// caught at compile time. Frontend renderers must continue to read
// these as opaque backend strings (R1.4) without re-deriving them. The
// node `x`/`y` strings and `methods.osculating.error.code` are derived
// (the lecture data and the contract-mandated deferred error code,
// respectively). Field names match the contract verbatim (R2.6).
// ---------------------------------------------------------------------------

const osculatingDeferredNodes = [
  { index: 0, x: "1.3", y: "0.6200860" },
  { index: 1, x: "1.6", y: "0.4554022" },
  { index: 2, x: "1.9", y: "0.2818186" },
]

const osculatingDeferredPolynomial = {
  expanded: "0.4554022 + 0.2(x - 1.6)",
  factored: null,
  lagrange_form:
    "0.6200860*L_0(x) + 0.4554022*L_1(x) + 0.2818186*L_2(x)",
  newton_form: null,
  hermite_form: null,
  taylor_form: null,
  latex_expanded: "0.4554022 + 0.2(x - 1.6)",
  latex_lagrange:
    "0.6200860\\,L_0(x) + 0.4554022\\,L_1(x) + 0.2818186\\,L_2(x)",
  latex_newton: null,
  latex_hermite: null,
  latex_taylor: null,
  expanded_omitted_reason: null,
}

export const osculatingDeferredResponse = {
  status: "partial",
  response_version: "1.0",
  metadata: { tolerance: cubicSplineTolerance },
  input_summary: {
    mode: "points",
    node_count: 3,
    degree: 2,
    methods_requested: ["lagrange", "osculating"],
    precision: 50,
    exact: true,
    function_known: false,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: osculatingDeferredNodes,
  degree: 2,
  polynomial: osculatingDeferredPolynomial,
  methods: {
    lagrange: {
      status: "ok",
      basis_polynomials: [
        { index: 0, x_i: "1.3", basis: "L_0", expanded: "L_0", latex: "L_0" },
        { index: 1, x_i: "1.6", basis: "L_1", expanded: "L_1", latex: "L_1" },
        { index: 2, x_i: "1.9", basis: "L_2", expanded: "L_2", latex: "L_2" },
      ],
      summation_form:
        "0.6200860*L_0(x) + 0.4554022*L_1(x) + 0.2818186*L_2(x)",
      expanded: "0.4554022 + 0.2(x - 1.6)",
      latex_expanded: "0.4554022 + 0.2(x - 1.6)",
      latex_lagrange:
        "0.6200860\\,L_0(x) + 0.4554022\\,L_1(x) + 0.2818186\\,L_2(x)",
      evaluations: [{ x: "1.5", value: "0.5118770" }],
      steps: [
        "Build each Lagrange basis polynomial so it is 1 at its own node and 0 at the others.",
      ],
      warnings: [],
      error: null,
    },
    osculating: {
      status: "error",
      warnings: [],
      error: {
        code: "method_not_implemented",
        message:
          "Osculating polynomial matching is accepted by the schema but is not implemented yet. Use Hermite for first-derivative matching.",
        details: {},
      },
    },
  },
  evaluations: [
    {
      x: "1.5",
      best_P_x: "0.5118770",
      best_method: "lagrange",
      method_values: { lagrange: "0.5118770", osculating: null },
      f_x: null,
      absolute_error: null,
      warnings: [],
    },
  ],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

// ---------------------------------------------------------------------------
// Phase 2 — Equal-Spacing Family error fixture (Newton Forward, ineligible spacing)
//
// Per design.md §12.1 and tasks.md task 6.6. Sourced from
// docs/API_CONTRACT.md "P2.1 Equal-Spacing Methods" error contract:
// equal-spacing methods require equally spaced x-values; when invoked
// with non-uniform spacing the method returns a method-level error
// with `error.code === "unequal_spacing"` and the top-level response
// status is `"partial"` because exactly one method was requested and
// it failed (R6.5, R15.1). Per the live backend contract the
// non-applicable method-level fields (`forward_difference_table`,
// `spacing_h`, `anchor_index`, `evaluations`, `steps`) are OMITTED
// entirely on a `status: "error"` result; only `status`, `warnings`,
// and `error` are present, matching the optional-fields type shape
// in `api-types.ts`. Renderers fall through to the shared
// `ErrorNotice` path. Field names match the contract verbatim (R2.6).
//
// Node `x`/`y` strings are derived from the chosen ineligible
// example (x = 1, 2, 4 with y = 1, 4, 16, where the spacing jumps
// from 1 to 2 between consecutive nodes); the `error.code` is the
// contract-mandated error string. No numeric values are computed by
// the frontend.
// ---------------------------------------------------------------------------

export const unequalSpacingErrorResponse = {
  status: "partial",
  response_version: "1.0",
  metadata: { tolerance: cubicSplineTolerance },
  input_summary: {
    mode: "points",
    node_count: 3,
    degree: 0,
    methods_requested: ["newton_forward"],
    precision: 50,
    exact: true,
    function_known: false,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: [
    { index: 0, x: "1", y: "1" },
    { index: 1, x: "2", y: "4" },
    { index: 2, x: "4", y: "16" },
  ],
  degree: 0,
  polynomial: cubicSplineErrorPolynomial,
  methods: {
    newton_forward: {
      status: "error",
      warnings: [],
      error: {
        code: "unequal_spacing",
        message:
          "Newton Forward requires equally spaced nodes; the supplied x-values vary in spacing.",
        details: {},
      },
    },
  },
  evaluations: [],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse

// ---------------------------------------------------------------------------
// Phase 2 — Derivative-Data Family error fixture (Hermite missing derivatives)
//
// Per design.md §12.1 and tasks.md task 6.6. Sourced from
// docs/API_CONTRACT.md "P2.2 Derivative-Data Methods" error contract:
// Hermite methods require a first derivative at every interpolation
// node; when one or more derivatives are missing, the method returns
// a method-level error with `error.code === "missing_derivative_data"`
// and the top-level response status is `"partial"` because exactly
// one method was requested and it failed (R7.4, R15.1). Per the
// live backend contract the non-applicable method-level fields
// (`repeated_nodes`, `divided_difference_table`, `coefficients`,
// `nested_form`, `expanded`, `latex_expanded`, `latex_hermite`,
// `evaluations`, `steps`, `basis_form`) are OMITTED entirely on a
// `status: "error"` result; only `status`, `warnings`, and `error`
// are present, matching the optional-fields type shape in
// `api-types.ts`. Renderers fall through to the shared `ErrorNotice`
// path. Field names match the contract verbatim (R2.6).
//
// Node `x`/`y` strings reuse the lecture-aligned Bessel-style points
// (x = 1.3, 1.6, 1.9) used elsewhere in this file; the `error.code`
// is the contract-mandated error string. No numeric values are
// computed by the frontend.
// ---------------------------------------------------------------------------

export const hermiteMissingDerivativeErrorResponse = {
  status: "partial",
  response_version: "1.0",
  metadata: { tolerance: cubicSplineTolerance },
  input_summary: {
    mode: "points",
    node_count: 3,
    degree: 0,
    methods_requested: ["hermite"],
    precision: 50,
    exact: true,
    function_known: false,
    graph_requested: false,
    sorted_nodes: false,
  },
  nodes: [
    { index: 0, x: "1.3", y: "0.6200860" },
    { index: 1, x: "1.6", y: "0.4554022" },
    { index: 2, x: "1.9", y: "0.2818186" },
  ],
  degree: 0,
  polynomial: cubicSplineErrorPolynomial,
  methods: {
    hermite: {
      status: "error",
      warnings: [],
      error: {
        code: "missing_derivative_data",
        message:
          "Hermite requires a first derivative at every node; one or more derivatives were missing.",
        details: {},
      },
    },
  },
  evaluations: [],
  graph_data: null,
  warnings: [],
  educational_notes: [],
} satisfies InterpolateResponse
