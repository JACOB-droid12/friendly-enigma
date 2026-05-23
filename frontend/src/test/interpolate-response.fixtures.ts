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
    latex_expanded: "6 - x",
    latex_lagrange: "4 \\left(\\frac{5}{3} - \\frac{x}{3}\\right) + \\frac{x}{3} - \\frac{2}{3}",
    latex_newton: "4 - x + 2",
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
