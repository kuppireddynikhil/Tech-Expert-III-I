-- ============================================================================
-- TECH EXPERT 2K26 — SEED QUESTIONS & QUESTION SETS
-- Sri Venkateswara College of Engineering (SVCE)
-- ============================================================================

DO $$
DECLARE
  v_q1_id UUID := gen_random_uuid();
  v_q2_id UUID := gen_random_uuid();
  v_q3_id UUID := gen_random_uuid();
  v_q4_id UUID := gen_random_uuid();
  v_q5_id UUID := gen_random_uuid();
  v_q6_id UUID := gen_random_uuid();
  v_q7_id UUID := gen_random_uuid();
  v_q8_id UUID := gen_random_uuid();
  v_q9_id UUID := gen_random_uuid();
  v_q10_id UUID := gen_random_uuid();
  v_q11_id UUID := gen_random_uuid();
  v_q12_id UUID := gen_random_uuid();
  v_q13_id UUID := gen_random_uuid();
  v_q14_id UUID := gen_random_uuid();
  v_q15_id UUID := gen_random_uuid();
  v_q16_id UUID := gen_random_uuid();
  v_q17_id UUID := gen_random_uuid();
  v_q18_id UUID := gen_random_uuid();
  v_q19_id UUID := gen_random_uuid();
  v_q20_id UUID := gen_random_uuid();

  v_p2_q1_id UUID := gen_random_uuid();
  v_p2_q2_id UUID := gen_random_uuid();
  v_p2_q3_id UUID := gen_random_uuid();

  v_p3_q1_id UUID := gen_random_uuid();
  v_p3_q2_id UUID := gen_random_uuid();
  v_p3_q3_id UUID := gen_random_uuid();

  v_set_p1_id UUID := gen_random_uuid();
  v_set_p2_id UUID := gen_random_uuid();
  v_set_p3_id UUID := gen_random_uuid();
BEGIN

  -- --------------------------------------------------------------------------
  -- PHASE 1: 20 Python MCQs (15s timer each)
  -- --------------------------------------------------------------------------
  INSERT INTO public.questions (id, phase, question_type, title, problem_statement, choices, private_correct_answers, scoring_points, custom_timer, difficulty, tags, is_published)
  VALUES
  (v_q1_id, 'phase1', 'mcq', 'Python Data Types & Mutability', 
   'Which of the following built-in Python data types is mutable?',
   '[{"id":"A","text":"tuple"},{"id":"B","text":"str"},{"id":"C","text":"list"},{"id":"D","text":"frozenset"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'easy', ARRAY['basics', 'datatypes'], true),

  (v_q2_id, 'phase1', 'mcq', 'Integer Division Operator', 
   'What is the evaluated result of 17 // 4 in Python 3?',
   '[{"id":"A","text":"4.25"},{"id":"B","text":"4"},{"id":"C","text":"5"},{"id":"D","text":"4.0"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'easy', ARRAY['operators'], true),

  (v_q3_id, 'phase1', 'mcq', 'String Slicing Step', 
   'Given s = "SVCE_TECH_2026", what does s[::-1] evaluate to?',
   '[{"id":"A","text":"SVCE_TECH_2026"},{"id":"B","text":"6202_HCET_ECVS"},{"id":"C","text":"6202"},{"id":"D","text":"Raises IndexError"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'easy', ARRAY['strings', 'slicing'], true),

  (v_q4_id, 'phase1', 'mcq', 'Boolean Identity vs Equality', 
   'What does the expression (a == b, a is b) return for a = [1, 2] and b = [1, 2]?',
   '[{"id":"A","text":"(True, True)"},{"id":"B","text":"(False, False)"},{"id":"C","text":"(True, False)"},{"id":"D","text":"(False, True)"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'medium', ARRAY['identity', 'memory'], true),

  (v_q5_id, 'phase1', 'mcq', 'Dictionary Key Constraints', 
   'Which of the following CANNOT be used as a dictionary key in standard Python?',
   '[{"id":"A","text":"(1, 2, 3)"},{"id":"B","text":"\"college_svce\""},{"id":"C","text":"[1, 2, 3]"},{"id":"D","text":"42"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'medium', ARRAY['dictionaries', 'hashability'], true),

  (v_q6_id, 'phase1', 'mcq', 'List Comprehension Filter', 
   'What is the output of [x**2 for x in range(5) if x % 2 == 1]?',
   '[{"id":"A","text":"[0, 4, 16]"},{"id":"B","text":"[1, 9]"},{"id":"C","text":"[1, 4, 9]"},{"id":"D","text":"[0, 1, 4, 9, 16]"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'easy', ARRAY['comprehensions'], true),

  (v_q7_id, 'phase1', 'mcq', 'Tuple Unpacking', 
   'What are the values of x, y after executing: x, *y, z = [10, 20, 30, 40, 50]?',
   '[{"id":"A","text":"x = 10, y = 20"},{"id":"B","text":"x = 10, y = [20, 30, 40]"},{"id":"C","text":"x = 10, y = (20, 30, 40)"},{"id":"D","text":"Raises ValueError"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'medium', ARRAY['unpacking', 'tuples'], true),

  (v_q8_id, 'phase1', 'mcq', 'Default Mutable Arguments', 
   'Consider def append_item(x, lst=[]): lst.append(x); return lst. What does append_item(2) followed by append_item(3) return on the second call?',
   '[{"id":"A","text":"[3]"},{"id":"B","text":"[2, 3]"},{"id":"C","text":"[[2], 3]"},{"id":"D","text":"Raises UnboundLocalError"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'hard', ARRAY['functions', 'gotchas'], true),

  (v_q9_id, 'phase1', 'mcq', 'Set Operations', 
   'Given s1 = {1, 2, 3, 4} and s2 = {3, 4, 5, 6}, what is s1 ^ s2?',
   '[{"id":"A","text":"{3, 4}"},{"id":"B","text":"{1, 2, 3, 4, 5, 6}"},{"id":"C","text":"{1, 2, 5, 6}"},{"id":"D","text":"{}"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'medium', ARRAY['sets', 'bitwise'], true),

  (v_q10_id, 'phase1', 'mcq', 'Loop Else Clause', 
   'When does an else clause attached to a for loop execute?',
   '[{"id":"A","text":"Only if the loop was terminated via break"},{"id":"B","text":"Only if the iterable exhausted normally without encountering break"},{"id":"C","text":"Before the loop starts"},{"id":"D","text":"Only if an exception occurred"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'medium', ARRAY['loops', 'control-flow'], true),

  (v_q11_id, 'phase1', 'mcq', 'Lambda Functions', 
   'What is the output of (lambda a, b=2: a * b)(5)?',
   '[{"id":"A","text":"10"},{"id":"B","text":"25"},{"id":"C","text":"TypeError"},{"id":"D","text":"5"}]'::jsonb,
   '["A"]'::jsonb, 10, 15, 'easy', ARRAY['lambda', 'functions'], true),

  (v_q12_id, 'phase1', 'mcq', 'Type Conversion Edge Cases', 
   'What is the evaluated output of bool("False") in Python?',
   '[{"id":"A","text":"False"},{"id":"B","text":"True"},{"id":"C","text":"0"},{"id":"D","text":"Raises ValueError"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'easy', ARRAY['type-conversion'], true),

  (v_q13_id, 'phase1', 'mcq', 'String split() Default Whitespace', 
   'What is the result of len("  svce   tech   expert  ".split())?',
   '[{"id":"A","text":"3"},{"id":"B","text":"6"},{"id":"C","text":"7"},{"id":"D","text":"1"}]'::jsonb,
   '["A"]'::jsonb, 10, 15, 'medium', ARRAY['strings'], true),

  (v_q14_id, 'phase1', 'mcq', 'Generator Expressions', 
   'What is the type of g in: g = (x * 2 for x in [1, 2, 3])?',
   '[{"id":"A","text":"tuple"},{"id":"B","text":"list"},{"id":"C","text":"generator"},{"id":"D","text":"iterator_proxy"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'medium', ARRAY['generators'], true),

  (v_q15_id, 'phase1', 'mcq', 'Dictionary get() Method', 
   'Given d = {"svce": 1985}, what does d.get("cse", 2026) return?',
   '[{"id":"A","text":"None"},{"id":"B","text":"KeyError"},{"id":"C","text":"2026"},{"id":"D","text":"1985"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'easy', ARRAY['dictionaries'], true),

  (v_q16_id, 'phase1', 'mcq', 'Chained Comparison Operators', 
   'What is the result of the expression 1 < 3 > 2 == 2 in Python?',
   '[{"id":"A","text":"True"},{"id":"B","text":"False"},{"id":"C","text":"TypeError"},{"id":"D","text":"1"}]'::jsonb,
   '["A"]'::jsonb, 10, 15, 'hard', ARRAY['operators', 'syntax'], true),

  (v_q17_id, 'phase1', 'mcq', 'pass vs continue Statement', 
   'What is the primary difference between pass and continue?',
   '[{"id":"A","text":"pass terminates the loop, continue jumps to next iteration"},{"id":"B","text":"pass is a null operation placeholder; continue skips the remainder of current iteration"},{"id":"C","text":"They are 100% interchangeable"},{"id":"D","text":"continue only works in functions"}]'::jsonb,
   '["B"]'::jsonb, 10, 15, 'easy', ARRAY['control-flow'], true),

  (v_q18_id, 'phase1', 'mcq', 'Global Scope Keyword', 
   'Which keyword is required to rebind an outer (enclosing, non-global) variable inside a nested function?',
   '[{"id":"A","text":"global"},{"id":"B","text":"outer"},{"id":"C","text":"nonlocal"},{"id":"D","text":"static"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'medium', ARRAY['scope', 'functions'], true),

  (v_q19_id, 'phase1', 'mcq', 'Exception Handling Finally', 
   'Under what condition does the finally block in try-except-finally execute?',
   '[{"id":"A","text":"Only when no exception is raised"},{"id":"B","text":"Only when an exception is handled"},{"id":"C","text":"Always, regardless of exceptions or returns"},{"id":"D","text":"Only if an unhandled error occurs"}]'::jsonb,
   '["C"]'::jsonb, 10, 15, 'easy', ARRAY['exceptions'], true),

  (v_q20_id, 'phase1', 'mcq', 'Zip Function with Unequal Lengths', 
   'What does list(zip([1, 2], ["A", "B", "C"])) return in Python 3?',
   '[{"id":"A","text":"[(1, \"A\"), (2, \"B\")]"},{"id":"B","text":"[(1, \"A\"), (2, \"B\"), (None, \"C\")]"},{"id":"C","text":"Raises ValueError"},{"id":"D","text":"[(1, 2), (\"A\", \"B\", \"C\")]"}]'::jsonb,
   '["A"]'::jsonb, 10, 15, 'medium', ARRAY['builtins', 'zip'], true);

  -- --------------------------------------------------------------------------
  -- PHASE 2: 3 Python Debugging Programs (15 min total phase deadline)
  -- --------------------------------------------------------------------------
  INSERT INTO public.questions (id, phase, question_type, title, problem_statement, starter_code, private_reference_solution, private_evaluation_rubric, scoring_points, difficulty, tags, is_published)
  VALUES
  (v_p2_q1_id, 'phase2', 'debug', 'Fix the Anagram Grouping Bug',
   'The function group_anagrams(words) is intended to group a list of strings into lists of anagrams. However, the developer used a mutable list as a dictionary key and forgot to return the grouped values as a list. Fix the code so it correctly groups anagrams regardless of order.',
   'def group_anagrams(words):
    anagram_map = {}
    for word in words:
        # BUG: Lists cannot be dict keys (unhashable type)
        sorted_chars = sorted(word)
        if sorted_chars not in anagram_map:
            anagram_map[sorted_chars] = []
        anagram_map[sorted_chars].append(word)
    return anagram_map',
   'def group_anagrams(words):
    anagram_map = {}
    for word in words:
        key = "".join(sorted(word))
        if key not in anagram_map:
            anagram_map[key] = []
        anagram_map[key].append(word)
    return list(anagram_map.values())',
   '{"test_cases": [{"input": "[\"eat\", \"tea\", \"tan\", \"ate\", \"nat\", \"bat\"]", "expected": "[[\"eat\", \"tea\", \"ate\"], [\"tan\", \"nat\"], [\"bat\"]]"}, {"input": "[\"\"]", "expected": "[[\"\"]]"}], "rubric": "Must convert sorted chars to hashable tuple or string key. Must return list of anagram groups."}'::jsonb,
   30, 'medium', ARRAY['debugging', 'hashmaps', 'strings'], true),

  (v_p2_q2_id, 'phase2', 'debug', 'Fix the Off-by-One Binary Search',
   'The function binary_search(arr, target) is supposed to return the 0-based index of target in a sorted list arr, or -1 if not found. Currently, it has an off-by-one error in boundary updates and mid-point calculation leading to infinite loops or incorrect indices.',
   'def binary_search(arr, target):
    low = 0
    high = len(arr) # BUG 1: Should be len(arr) - 1 for index range
    while low < high: # BUG 2: Should be low <= high
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid # BUG 3: Infinite loop when target is higher
        else:
            high = mid
    return -1',
   'def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1',
   '{"test_cases": [{"input": "[1, 3, 5, 7, 9], 7", "expected": "3"}, {"input": "[2, 4, 6, 8], 10", "expected": "-1"}, {"input": "[5], 5", "expected": "0"}], "rubric": "Correct initialization of high to len-1, low <= high condition, and proper low=mid+1 / high=mid-1 transitions."}'::jsonb,
   30, 'medium', ARRAY['debugging', 'binary-search', 'algorithms'], true),

  (v_p2_q3_id, 'phase2', 'debug', 'Fix In-Place Dictionary Modification Bug',
   'The function sanitize_config(data, blocked_keys) attempts to remove sensitive keys from a configuration dictionary. But iterating directly over data.keys() while deleting items raises RuntimeError: dictionary changed size during iteration. Fix the mutation logic.',
   'def sanitize_config(data, blocked_keys):
    # BUG: Modifying dict while iterating over it directly
    for k in data.keys():
        if k in blocked_keys:
            del data[k]
    return data',
   'def sanitize_config(data, blocked_keys):
    for k in list(data.keys()):
        if k in blocked_keys:
            del data[k]
    return data',
   '{"test_cases": [{"input": "{\"api_key\": \"secret\", \"port\": 8080, \"debug\": True}, [\"api_key\", \"secret\"]", "expected": "{\"port\": 8080, \"debug\": True}"}], "rubric": "Must iterate over a copy or list of keys, or use dictionary comprehension to avoid mutation collision."}'::jsonb,
   40, 'hard', ARRAY['debugging', 'mutation', 'dictionaries'], true);

  -- --------------------------------------------------------------------------
  -- PHASE 3: 3 Python Logic Builder Programs (Max 3 attempts per program)
  -- --------------------------------------------------------------------------
  INSERT INTO public.questions (id, phase, question_type, title, problem_statement, starter_code, private_reference_solution, private_evaluation_rubric, scoring_points, difficulty, tags, is_published)
  VALUES
  (v_p3_q1_id, 'phase3', 'logic', 'Logic Challenge 1: Matrix Spiral Order Traversal',
   'Implement the function spiral_order(matrix) that takes an m x n 2D matrix of integers and returns all elements of the matrix in spiral order (clockwise starting from top-left). You cannot use external libraries.\n\nInput Example:\nmatrix = [\n  [1, 2, 3],\n  [4, 5, 6],\n  [7, 8, 9]\n]\nOutput Example: [1, 2, 3, 6, 9, 8, 7, 4, 5]',
   'def spiral_order(matrix):
    # Complete the logic to return elements in clockwise spiral order
    result = []
    if not matrix or not matrix[0]:
        return result
    
    # Write your boundary traversal logic here
    
    return result',
   'def spiral_order(matrix):
    result = []
    if not matrix or not matrix[0]:
        return result
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            result.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            result.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                result.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                result.append(matrix[r][left])
            left += 1
    return result',
   '{"test_cases": [{"input": "[[1,2,3],[4,5,6],[7,8,9]]", "expected": "[1,2,3,6,9,8,7,4,5]"}, {"input": "[[1,2,3,4],[5,6,7,8],[9,10,11,12]]", "expected": "[1,2,3,4,8,12,11,10,9,5,6,7]"}], "rubric": "Handle arbitrary rectangular m x n matrices, boundary checks, and empty cases."}'::jsonb,
   50, 'hard', ARRAY['matrices', 'traversal', 'simulation'], true),

  (v_p3_q2_id, 'phase3', 'logic', 'Logic Challenge 2: Longest Valid Parentheses Substring',
   'Implement the function longest_valid_parentheses(s) that finds the length of the longest valid (well-formed) parentheses substring.\n\nExample 1: s = ")()())" -> Output: 4 ("()()")\nExample 2: s = "(()" -> Output: 2 ("()")\nExample 3: s = "" -> Output: 0',
   'def longest_valid_parentheses(s: str) -> int:
    # Complete the logic using stack or dynamic programming
    max_len = 0
    # Your logic here
    return max_len',
   'def longest_valid_parentheses(s: str) -> int:
    max_len = 0
    stack = [-1]
    for i, char in enumerate(s):
        if char == "(":
            stack.append(i)
        else:
            stack.pop()
            if not stack:
                stack.append(i)
            else:
                max_len = max(max_len, i - stack[-1])
    return max_len',
   '{"test_cases": [{"input": "\")()())\"", "expected": "4"}, {"input": "\"(()\"", "expected": "2"}, {"input": "\"\"", "expected": "0"}], "rubric": "Linear time solution using stack or two-pass counter. Must handle edge cases like unbalanced brackets."}'::jsonb,
   50, 'hard', ARRAY['stack', 'dynamic-programming', 'strings'], true),

  (v_p3_q3_id, 'phase3', 'logic', 'Logic Challenge 3: Minimum Path Sum in Obstacle Grid',
   'Implement the function min_path_sum(grid) that finds a path from top-left (0,0) to bottom-right (m-1, n-1) which minimizes the sum of all numbers along its path. You can only move either down or right at any point in time.\n\nExample:\ngrid = [\n  [1, 3, 1],\n  [1, 5, 1],\n  [4, 2, 1]\n]\nOutput: 7 (Path 1 -> 3 -> 1 -> 1 -> 1 = 7)',
   'def min_path_sum(grid):
    # Complete the logic using dynamic programming
    if not grid or not grid[0]:
        return 0
    # Your logic here
    return 0',
   'def min_path_sum(grid):
    if not grid or not grid[0]:
        return 0
    m, n = len(grid), len(grid[0])
    dp = [row[:] for row in grid]
    for j in range(1, n):
        dp[0][j] += dp[0][j - 1]
    for i in range(1, m):
        dp[i][0] += dp[i - 1][0]
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] += min(dp[i - 1][j], dp[i][j - 1])
    return dp[m - 1][n - 1]',
   '{"test_cases": [{"input": "[[1,3,1],[1,5,1],[4,2,1]]", "expected": "7"}, {"input": "[[1,2,3],[4,5,6]]", "expected": "12"}], "rubric": "Must use dynamic programming or memoization to compute minimum cumulative weight. Handle 1xN and Nx1 grids."}'::jsonb,
   50, 'hard', ARRAY['dynamic-programming', 'grid-optimization'], true);

  -- --------------------------------------------------------------------------
  -- QUESTION SETS
  -- --------------------------------------------------------------------------
  -- Phase 1 - Set A
  INSERT INTO public.question_sets (id, set_name, phase, description, is_published, default_timer, timer_policy)
  VALUES (v_set_p1_id, 'Phase 1 — Set A (Core Python)', 'phase1', 'Official 20-question fundamentals quiz with 15s per question countdown', true, 15, 'per_question');

  -- Phase 2 - Set A
  INSERT INTO public.question_sets (id, set_name, phase, description, is_published, default_timer, timer_policy)
  VALUES (v_set_p2_id, 'Phase 2 — Debugging Set A', 'phase2', 'Official 3-program debugging challenge with 15 minutes overall phase limit', true, 0, 'total_phase');

  -- Phase 3 - Set A
  INSERT INTO public.question_sets (id, set_name, phase, description, is_published, default_timer, timer_policy)
  VALUES (v_set_p3_id, 'Phase 3 — Logic Set A (Finals)', 'phase3', 'Finalist round with 3 logic programs and 3-attempt execution limit', true, 0, 'unlimited');

  -- --------------------------------------------------------------------------
  -- QUESTION SET ITEMS (Ordering & Timers)
  -- --------------------------------------------------------------------------
  -- Set 1 items
  INSERT INTO public.question_set_items (set_id, question_id, display_order, timer_override) VALUES
  (v_set_p1_id, v_q1_id, 1, 15),
  (v_set_p1_id, v_q2_id, 2, 15),
  (v_set_p1_id, v_q3_id, 3, 15),
  (v_set_p1_id, v_q4_id, 4, 15),
  (v_set_p1_id, v_q5_id, 5, 15),
  (v_set_p1_id, v_q6_id, 6, 15),
  (v_set_p1_id, v_q7_id, 7, 15),
  (v_set_p1_id, v_q8_id, 8, 15),
  (v_set_p1_id, v_q9_id, 9, 15),
  (v_set_p1_id, v_q10_id, 10, 15),
  (v_set_p1_id, v_q11_id, 11, 15),
  (v_set_p1_id, v_q12_id, 12, 15),
  (v_set_p1_id, v_q13_id, 13, 15),
  (v_set_p1_id, v_q14_id, 14, 15),
  (v_set_p1_id, v_q15_id, 15, 15),
  (v_set_p1_id, v_q16_id, 16, 15),
  (v_set_p1_id, v_q17_id, 17, 15),
  (v_set_p1_id, v_q18_id, 18, 15),
  (v_set_p1_id, v_q19_id, 19, 15),
  (v_set_p1_id, v_q20_id, 20, 15);

  -- Set 2 items
  INSERT INTO public.question_set_items (set_id, question_id, display_order, timer_override) VALUES
  (v_set_p2_id, v_p2_q1_id, 1, NULL),
  (v_set_p2_id, v_p2_q2_id, 2, NULL),
  (v_set_p2_id, v_p2_q3_id, 3, NULL);

  -- Set 3 items
  INSERT INTO public.question_set_items (set_id, question_id, display_order, timer_override) VALUES
  (v_set_p3_id, v_p3_q1_id, 1, NULL),
  (v_set_p3_id, v_p3_q2_id, 2, NULL),
  (v_set_p3_id, v_p3_q3_id, 3, NULL);

  -- --------------------------------------------------------------------------
  -- DEFAULT SET ASSIGNMENTS (Assign Set A of Phase 1 to 'all')
  -- --------------------------------------------------------------------------
  INSERT INTO public.question_set_assignments (set_id, target_type, target_value, is_active) VALUES
  (v_set_p1_id, 'all', 'all', true),
  (v_set_p2_id, 'all', 'all', true),
  (v_set_p3_id, 'all', 'all', true);

END $$;
