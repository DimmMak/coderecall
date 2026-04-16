# CodeRecall SKILL.md Stress Test Report

25 simulated playthroughs. Every issue referenced to exact SKILL.md line numbers.

---

## SCENARIO-BY-SCENARIO RESULTS

---

### Scenario 1 — SQL, TSLA, "check Druck's $315 support", Level 1, section: acquire

**Simulation:** User enters sql / TSLA / "check Druck's $315 support" / 1. Then picks "acquire".

**Flow:** SESSION START (line 18) collects language, stock, objective, level. Then THE SECTIONS (line 39) shows SQL sections menu. User picks "acquire". QUESTION GENERATION (line 260) fires with the TSLA/$315 example, which is literally the example in the skill. Drill presents at Level 1 (line 90) with every-other-letter blanking. User types first letters. Score at 5pts/keyword (line 189).

**Issues found:**
- SESSION START asks 4 things (language, stock, objective, level) but line 19 says "ask these 3 things." The section menu is a 5th step. **Mismatch: the skill says 3 questions but there are actually 4 inputs + 1 section pick = 5 steps.**
- Lines 18-33: The SESSION START block shows language, stock, objective, AND level all in one prompt, then line 40 says "When the user picks a language, show the section menu." This means the section pick happens AFTER all 4 answers. But the flow description is ambiguous about ordering — does the user answer all 4 at once, or is it sequential? If all at once, the section menu comes as a second screen. If sequential, when does the section menu appear?
- Level 1 example (line 96): "S_L_C_" — this blanks every other letter of SELECT. But the rule says "show every other letter" which is ambiguous: do you show letters at positions 1,3,5 or 2,4,6? The example shows S_L_C_ which is positions 1,3,5 shown. Need to clarify the rule.

**Verdict:** Playable but the session start ordering is confusing for the implementer.

---

### Scenario 2 — SQL, NVDA, "check if overvalued", Level 2, section: aggregate

**Simulation:** User enters sql / NVDA / "check if overvalued" / 2. Picks "aggregate".

**Flow:** Drills generated about NVDA valuation using GROUP BY, HAVING, COUNT, SUM, AVG, MIN, MAX. Level 2 shows first letter + underscores. User types one letter per keyword.

**Issues found:**
- QUESTION GENERATION (line 260) says "Generate 10 drills for the selected section." But GAME LOOP Step 5 (line 179) says "Load the next drill from the same section. Keep going until user types stop." There is no mention of what happens after the 10 drills are exhausted. **Does the system generate more? Loop back to drill 1? End the session?**
- For "aggregate" drills about "overvalued" — the skill doesn't define how to map an abstract objective like "check if overvalued" to aggregate queries. The QUESTION GENERATION section only gives an "acquire" example. The implementer has no guidance for how aggregate drills should feel when themed around valuation.

**Verdict:** Works but the 10-drill limit creates an unaddressed edge case.

---

### Scenario 3 — SQL, skip stock, Level 2, section: join

**Simulation:** User enters sql / skip / (no objective since stock is skipped?) / 2. Picks "join".

**Flow:** Line 275: "If user typed 'skip' for stock: Use generic but realistic drills." Generic JOIN drills with employees, orders, etc.

**Issues found:**
- **If the user skips stock, what happens to the objective question?** Line 25-27 shows Stock and Objective as separate questions. Line 275 only addresses skipping stock. Can a user skip stock but still provide an objective? That makes no sense ("find earnings impact" but no stock). The skill doesn't say "if stock is skip, also skip objective automatically."
- The skip behavior for objective is only mentioned in line 5 of SESSION START ("skip" option listed) but QUESTION GENERATION (line 260) only has two branches: stock+objective (line 263) and skip-stock (line 275). **There's no branch for: stock provided + objective skipped.**

**Verdict:** Ambiguous. Needs explicit skip-chaining rules.

---

### Scenario 4 — SQL, AAPL, "earnings impact on price", Level 3, section: time

**Simulation:** User enters sql / AAPL / "earnings impact on price" / 3. Picks "time".

**Flow:** Time section drills (DATE_TRUNC, EXTRACT, INTERVAL, etc.) themed around AAPL earnings dates. Level 3 shows only underscores (line 120). User types full keywords (line 138).

**Issues found:**
- Level 3 instruction (line 132): "Type the full keyword" — but for multi-word keywords like "GROUP BY", "ORDER BY", "DATE_TRUNC", "CASE WHEN", does the user type the whole thing as one input or each word separately? Line 285 says "ONE KEYWORD AT A TIME" but GROUP BY is sometimes treated as one keyword and sometimes as two. **The keyword list in the drill bank (line 305) shows "SELECT", "FROM" etc. as single tokens, but the SQL sections list (line 56) shows "CASE WHEN" as one entry. Is "CASE WHEN" one keyword or two?**
- Level 3 blank rendering: For "DATE_TRUNC", line 123 shows "______" (6 underscores for a 10-char keyword). **The underscore count doesn't match the character count.** Is the underscore count supposed to match? Line 105-106 (Level 2) shows "S_____" for SELECT (6 chars, 6 positions) which DOES match. But line 123 shows "______" for SELECT which is also 6 underscores — that matches. But "___" for AVG is 3 underscores for 3 chars — matches. So the underscores DO represent length. But the example at line 123 shows "__" for "AS" which is 2 chars, and "__" for "BY" which is 2 chars. These are indistinguishable. **At Level 3, "AS" and "BY" both show as "__" — the user has no way to distinguish them without context.**
- This is actually fine since context (position in query) disambiguates, but worth noting.

**Verdict:** Multi-word keyword ambiguity is a real problem. Needs a definitive rule.

---

### Scenario 5 — SQL, META, skip objective, Level 1, section: clean

**Simulation:** User enters sql / META / skip / 1. Picks "clean".

**Flow:** This is the "stock provided + objective skipped" case.

**Issues found:**
- **This exact combination has NO generation rule.** Line 263: "If user entered a stock + objective" — skip is not an objective. Line 275: "If user typed 'skip' for stock" — they didn't skip stock. There is no rule for "stock provided, objective skipped." The system must infer generic objectives for META, but the skill gives no guidance.
- For the "clean" section with META — COALESCE, NULLIF, CASE WHEN, CAST, TRIM, REPLACE are the keywords. The implementer needs to generate cleaning drills about META data, but without an objective, what data is being cleaned? The skill should say something like "generate drills using the stock's typical financial data (price, volume, earnings, etc.)"

**Verdict:** Broken generation path. Needs a third branch in QUESTION GENERATION.

---

### Scenario 6 — SQL, skip, skip, Level 2, section: shuffle

**Simulation:** User enters sql / skip / skip / 2. Types "shuffle".

**Flow:** Generic drills, random sections. All skip, all random.

**Issues found:**
- Line 58: shuffle is listed as a section option. Line 226: shuffle is also a session command. **If a user types "shuffle" mid-session, does it re-randomize the current section, or is it treated as the command to switch to shuffle mode?** The SESSION COMMANDS (line 214) lists shuffle as "Random drills from all sections" which implies it's a mode switch. But during section selection, it's also a valid pick. **Dual meaning creates confusion.**
- With all skips + shuffle, the system generates generic drills from random SQL sections. This is the simplest path and should work fine.

**Verdict:** Works, but the shuffle dual-meaning needs clarification.

---

### Scenario 7 — SQL, XOM, "commodity exposure", Level 2, section: sort-rank

**Simulation:** User enters sql / XOM / "commodity exposure" / 2. Picks "sort-rank".

**Flow:** Sort-rank drills about XOM commodity exposure. ORDER BY, ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD.

**Issues found:**
- LAG and LEAD are window functions that require OVER(PARTITION BY ... ORDER BY ...). This means a single drill might have keywords: SELECT, LAG/LEAD, OVER, PARTITION BY, ORDER BY, FROM, WHERE. **Is "PARTITION BY" one keyword or two? Is "ORDER BY" inside a window function the same keyword as "ORDER BY" at the end of a query?** The keyword definition (line 313) says "SQL reserved words" but doesn't address compound keywords.
- Section name "sort-rank" has a hyphen. When the user types this, do they type "sort-rank" or "sort" or "sort rank"? **No input parsing rules defined.**

**Verdict:** Compound keyword problem is systemic. Section name input parsing undefined.

---

### Scenario 8 — SQL, JPM, "credit risk", Level 3, section: advanced

**Simulation:** User enters sql / JPM / "credit risk" / 3. Picks "advanced".

**Flow:** Advanced section: subqueries, CTEs (WITH), EXISTS, UNION, nested queries. Level 3, full recall.

**Issues found:**
- **CTEs use "WITH ... AS (...)" syntax. Is "WITH" a keyword? Is "AS" a keyword?** "AS" is used in aliases everywhere (SELECT x AS y). If "AS" is always a keyword, it appears in almost every query and would be blanked constantly. The skill examples (line 96) show "A_" for AS at Level 1, confirming AS is treated as a keyword. But this means every alias in every drill adds keyword blanks, which could make drills extremely tedious.
- Advanced section drills with nested queries at Level 3 could produce 15+ keywords in a single drill. **No max keyword count per drill is defined.** A CTE with a subquery could easily have: WITH, AS, SELECT, FROM, WHERE, AND, SELECT, FROM, JOIN, ON, WHERE, GROUP BY, HAVING, ORDER BY = 14+ keywords. At Level 3 this is brutal and potentially unfun.
- **No difficulty scaling guidance within a section.** Should drill 1 be easier than drill 10? The skill doesn't say.

**Verdict:** Playable but potentially overwhelming. Needs max keyword guidance.

---

### Scenario 9 — SQL, TSLA, "delivery numbers", Level 1, section: aggregate. User types "switch" mid-drill.

**Simulation:** User starts aggregate drills about TSLA delivery numbers. Mid-drill (after answering 3 of 6 keywords), types "switch".

**Flow:** Line 181: 'User types "switch" to change section.' But this is listed under Step 5 (Repeat), which fires AFTER a drill is complete. **What happens if the user types "switch" in the MIDDLE of a drill?**

**Issues found:**
- **The skill doesn't define mid-drill command handling.** Step 2 (line 136) says "User types ONE letter at a time." If the user types "s" — is that the letter S for a keyword, or the start of "switch"? At Level 1 and 2, the user types single letters. "s" could be a valid answer. The system can't distinguish between "s" (answer) and "switch" (command) unless it waits for more characters.
- **At Level 3, the user types full words.** If the current keyword is "SELECT" and the user types "switch", that's clearly not "SELECT". But the skill says to show "Try again" on wrong answers (line 153). It would show an error instead of processing the command.
- **Critical: There is no mechanism to distinguish commands from answers.** The skill needs a command prefix (like "/" or "!") or explicit rules for when commands are checked vs. answers.

**Verdict:** BROKEN. Commands and answers occupy the same input space with no disambiguation.

---

### Scenario 10 — SQL, NVDA, "AI revenue", Level 2, section: acquire. User types wrong letter 5 times in a row.

**Simulation:** User starts acquire drills. Current keyword is "SELECT". User types W, X, Z, A, B (all wrong).

**Flow:** Each wrong answer: show "Try again" (line 153), streak resets to 0 (line 155), -1 penalty per wrong (Level 2, line 206). After 5 wrong: -5 pts, streak at 0.

**Issues found:**
- **No max-wrong-attempts rule.** The user could type wrong letters indefinitely and accumulate unlimited negative points. No hint system. No "give up" option. No auto-reveal after N attempts. The user is stuck on a keyword forever with no escape except "stop" — but wait, can they type "stop" mid-keyword? See Scenario 9's issue.
- **The penalty at Level 2 is -1 per wrong answer.** If the user fat-fingers or is genuinely stuck, they could go deeply negative. No floor on score (can it go below 0?).
- **Score display says "+10 pts" for correct and "-1" for wrong. But the wrong answer display (line 153) just shows "Try again" with no score update.** Line 148 says "Show points earned. Show streak." after correct. But the wrong answer block (line 153-155) doesn't say to show the penalty or the updated score. **Inconsistency: correct answers show score, wrong answers don't.**

**Verdict:** Missing max-attempts, missing negative score floor, inconsistent score display on wrong answers.

---

### Scenario 11 — SQL, skip, skip, Level 3, section: join. Testing "type full keyword" clarity.

**Simulation:** Generic join drills. Level 3. User must type full keywords. First keyword is "SELECT".

**Flow:** The drill shows all underscores (line 120). "Type the full keyword" (line 132). User types "SELECT".

**Issues found:**
- **Case sensitivity undefined.** If user types "select" (lowercase), is that correct? SQL keywords are conventionally uppercase, but the skill never states whether input is case-sensitive. The keyword list (line 305) shows uppercase keywords. **Must define: case-insensitive matching or require uppercase.**
- **For "INNER JOIN" — is the user supposed to type "INNER JOIN" as one input or "INNER" then "JOIN" separately?** The JOIN section (line 52) lists "INNER JOIN" as one item. If it's one keyword, the blank would be "__________ " (10 underscores). If two, it's "_____ ____". The skill doesn't specify.
- **"ON" as a keyword in joins: it's only 2 characters. At Level 3, it's "__". The user types "ON" — that's fast but the blank gives minimal context. Combined with "AS" (also "__"), the user sees identical blanks for different keywords.** This is fine because positional context helps, but it increases difficulty beyond what's useful at Level 3.

**Verdict:** Case sensitivity and compound keyword handling are undefined. Both are critical for Level 3.

---

### Scenario 12 — SQL, BRK.B, "owner earnings", Level 2, section: aggregate. User types "level" to switch to Level 3.

**Simulation:** User starts at Level 2. After a few drills, types "level". Wants to switch to Level 3.

**Flow:** Line 183: 'User types "level" to change level.' But same problem as Scenario 9 — this is listed under Step 5 (after drill completion). Also, what happens after typing "level"?

**Issues found:**
- **After typing "level", does the system ask "Which level?" or does it cycle 1->2->3->1?** The skill doesn't specify the level-change interaction. The session command (line 222) just says "Change level (1/2/3)" which implies a follow-up question, but the "NO CONVERSATIONS" rule (line 282) says don't chat.
- **Same command-vs-answer conflict as Scenario 9.** At Level 2, user types single letters. "l" could be an answer. At Level 3, "level" could be an answer for... well, no SQL keyword is "level" but the ambiguity principle remains.
- **If the user switches from Level 2 to Level 3 mid-session: does the current drill restart at the new level? Does a new drill begin? Are the stats (score, streak) preserved?** No transition rules defined.
- **Ticker "BRK.B" contains a dot.** No issues with this specifically, but worth noting that the skill doesn't restrict ticker format. Tickers like BRK.A, BRK.B are valid.

**Verdict:** Level-switch interaction is completely undefined beyond "it exists."

---

### Scenario 13 — SQL, TSLA, "support levels", Level 2, section: acquire. User types "done" after 3 drills.

**Simulation:** User completes 3 drills, then types "done".

**Flow:** Line 232: when user types "done", show SESSION END block (line 234).

**Issues found:**
- **"done" at Level 2: user types one letter at a time. "d" could be a keyword answer.** Same command-vs-answer collision. If the current keyword starts with D (DELETE, DISTINCT, DESC), typing "d" is a correct answer, not the "done" command.
- **SESSION END (line 234) shows "Keywords Mastered" and "Needs Work" lists.** After only 3 drills, the data is thin. What's the threshold for "mastered"? The skill doesn't define it. Is it 100% correct? 3/3? 5/5 minimum attempts?
- The recommendation at line 252 says "Drill the 'clean' section next" — this is hard-coded in the example. The skill implies the system should generate recommendations, but **no recommendation algorithm is defined.**

**Verdict:** Command collision. Missing mastery threshold definition. Missing recommendation logic.

---

### Scenario 14 — Python, TSLA, "plot price vs 200-day MA", Level 2, section: visualize

**Simulation:** User enters python / TSLA / "plot price vs 200-day MA" / 2. Picks "visualize".

**Flow:** Visualize section: plt.plot, plt.bar, sns.heatmap, plt.scatter, plt.hist. Drills about plotting TSLA price against 200-day MA.

**Issues found:**
- **Python keyword definition (line 314): "language keywords (import, def, return, for, if) + pandas methods (groupby, merge, fillna, etc.)"** But the visualize section uses matplotlib and seaborn, not pandas. **Are "plt.plot", "plt.bar", "sns.heatmap" keywords?** If "plt.plot" is a keyword, how is it blanked? Is "plt" visible and "plot" blanked? Or is "plt.plot" blanked as one unit? The dot notation creates ambiguity.
- **Python code structure differs fundamentally from SQL.** SQL is clause-based (SELECT...FROM...WHERE). Python is line-based with chaining (df.groupby('x').agg('mean')). The blanking mechanic maps well to SQL keywords but poorly to Python method chains. If "groupby" is blanked in "df.groupby('ticker')", the user sees "df.______('ticker')" — but at Level 2 that's "df.g______('ticker')" and at Level 1 "df.g_o_p_y('ticker')". **The dot before the method: is it part of the keyword or a visible separator?**
- **"import" as a keyword: "import pandas as pd" — is "import" blanked, "as" blanked, "pandas" blanked, "pd" blanked? "pandas" is a library name (like a table name in SQL — should be visible). "pd" is an alias. "as" is a keyword. "import" is a keyword.** The skill's "not a keyword" list (line 317-320) only covers SQL examples. No Python-specific non-keyword rules.

**Verdict:** Python blanking rules are severely underspecified. The entire keyword/non-keyword distinction needs Python-specific rules.

---

### Scenario 15 — Python, NVDA, "clean earnings data", Level 1, section: clean

**Simulation:** User enters python / NVDA / "clean earnings data" / 1. Picks "clean".

**Flow:** Clean section: fillna, dropna, astype, rename, drop_duplicates, replace. Level 1, half visible.

**Issues found:**
- **"drop_duplicates" at Level 1: half visible would be "d_o_._u_l_c_t_s" or "d_o_\_d_p_i_a_e_"?** The underscore in "drop_duplicates" collides with the blanking underscore convention. **How do you represent a blank inside a keyword that already contains underscores?** "drop_duplicates" blanked at Level 1: d_o_\_d_p_i_a_e_ — the backslash-underscore vs blank-underscore is visually confusing.
- Same issue with "value_counts", "read_csv", "drop_duplicates", "read_excel", "read_sql" — many pandas methods contain underscores.

**Verdict:** Underscore-in-keyword collision is a serious visual problem for Python drills.

---

### Scenario 16 — Python, skip, skip, Level 2, section: load

**Simulation:** User enters python / skip / skip / 2. Picks "load".

**Flow:** Generic data loading drills. read_csv, read_sql, read_excel, pd.DataFrame.

**Issues found:**
- **"pd.DataFrame" — is "pd" a keyword, "DataFrame" a keyword, or "pd.DataFrame" one keyword?** The skill says pandas methods are keywords. DataFrame is a class, not a method. Is it still blanked?
- **"read_csv" — this is called as "pd.read_csv('file.csv')". Is "pd" visible (it's an alias, like a table name) and "read_csv" the keyword? Or is "pd.read_csv" the keyword?**
- Generic drills with "skip" stock: line 275 says use "employees, sales, orders, products, customers" as table names. But for Python load drills, you'd be loading FILES not tables (unless using read_sql). The generic examples are SQL-biased. **No Python-specific generic data sources defined (e.g., 'sales_data.csv', 'employees.xlsx').**

**Verdict:** Python keyword boundary problem + missing Python-specific generic examples.

---

### Scenario 17 — Python, AAPL, "quarterly revenue growth", Level 2, section: aggregate

**Simulation:** User enters python / AAPL / "quarterly revenue growth" / 2. Picks "aggregate".

**Flow:** Aggregate section: groupby, agg, pivot_table, crosstab, transform. Drills about AAPL quarterly revenue.

**Issues found:**
- **Method chaining: "df.groupby('quarter').agg({'revenue': 'sum'})" — "groupby" and "agg" are keywords. But "sum" inside the dict: is it a keyword? It's a string argument, not a method call.** The skill doesn't distinguish between methods-as-keywords and string-arguments-that-are-method-names.
- **"pivot_table" has an underscore — same visual collision issue as Scenario 15.**
- The section lists "transform" as an aggregate keyword but also has a separate "transform" section (line 75). **A keyword appearing in multiple sections could confuse the drill generation.**

**Verdict:** String-vs-method ambiguity for aggregation functions. Underscore collision.

---

### Scenario 18 — Python, META, "filter by date range", Level 3, section: filter

**Simulation:** User enters python / META / "filter by date range" / 3. Picks "filter".

**Flow:** Filter section: df[condition], loc, iloc, query, isin, between. Level 3, full recall.

**Issues found:**
- **"df[condition]" is not a method — it's bracket notation. How do you blank bracket access?** In "df[df['close'] > 300]", what's the keyword? There's no method name to blank. The "filter" section lists "df[condition]" as a drill topic but it has no keyword to blank using the current mechanic.
- **"loc" and "iloc" at Level 3: these are 3 and 4 characters. Blanks would be "___" and "____". In a line like "df.___[df['date'] > '2026-01-01']", the user has to guess "loc" vs "iloc" from the underscore count.** This actually works — the length differentiates them. But it's marginal.
- **"query" method: df.query("close > 300") — is "query" a keyword?** It's a pandas method, so yes per the rules. But "query" is also a common English word that might confuse the system if used in drill prompts.
- **"between" in pandas: df['close'].between(200, 300). But "between" is also in the SQL sections (line 50). Cross-language keyword overlap could confuse drill generation if not properly scoped.**

**Verdict:** df[condition] bracket notation has no blankable keyword — breaks the mechanic entirely for that drill type.

---

### Scenario 19 — Python, skip, skip, Level 2, section: shuffle

**Simulation:** All defaults, random Python drills.

**Flow:** Same shuffle dual-meaning issue as Scenario 6. Generic Python drills from random sections.

**Issues found:**
- **Same issues as Scenario 6 (shuffle ambiguity).**
- **Python shuffle pulls from 8 sections (line 64-78). Some sections have the compound keyword problems discussed above. In shuffle mode, the user encounters all the unresolved Python blanking issues across all sections in random order.** This is the hardest test of the blanking mechanic.
- **No weighting for shuffle.** Does shuffle pull equally from all sections, or weight toward the user's weak areas? The skill doesn't say.

**Verdict:** Shuffle works conceptually but inherits all Python blanking problems.

---

### Scenario 20 — Python, XOM, "merge price and volume data", Level 2, section: merge

**Simulation:** User enters python / XOM / "merge price and volume data" / 2. Picks "merge".

**Flow:** Merge section: merge, concat, join, append. Drills about merging XOM price and volume data.

**Issues found:**
- **"append" is deprecated in modern pandas (removed in 2.0).** The skill lists it as a merge keyword. This generates drills teaching deprecated code. Not a flow issue but a content accuracy issue.
- **"merge" is both a section name and a keyword.** When the user types "merge" at Level 3, is it an answer or are they trying to switch to the merge section? Same command-collision issue but even worse because the command name IS a keyword.
- **pd.merge() vs df.merge() — the keyword is "merge" but it can be called two ways. Which form do drills use?** The skill doesn't specify.

**Verdict:** Deprecated keyword. "merge" is both a section name and keyword — severe command collision.

---

### Scenario 21 — Python, JPM, "explore balance sheet data", Level 1, section: explore

**Simulation:** User enters python / JPM / "explore balance sheet data" / 1. Picks "explore".

**Flow:** Explore section: head, describe, info, value_counts, shape, dtypes, nunique. Level 1.

**Issues found:**
- **"shape" and "dtypes" are ATTRIBUTES, not methods. "df.shape" has no parentheses. "df.dtypes" has no parentheses.** How do you blank an attribute? "df.s_a_e" (Level 1)? But there are no parentheses after it, which changes the visual pattern. The skill doesn't distinguish attributes from methods.
- **"info" is a method (df.info()) but it prints output rather than returning a value.** Not a blanking issue, but the drill prompt would be unusual: "Display info about the DataFrame" -> "df.i_f_()" at Level 1. This works fine.
- **"value_counts" — underscore collision again.**
- **"nunique" at Level 1: "n_n_q_e" — only 7 characters, the half-visible version is almost as hard as full recall.** Short keywords don't benefit much from the half-visible mechanic.

**Verdict:** Attribute vs method distinction missing. Underscore collision. Short keywords don't scale well across levels.

---

### Scenario 22 — Python, TSLA, "rolling 50-day average", Level 2, section: transform

**Simulation:** User enters python / TSLA / "rolling 50-day average" / 2. Picks "transform".

**Flow:** Transform section: apply, lambda, map, rolling, shift, pct_change, cumsum.

**Issues found:**
- **"lambda" is a Python keyword, not a pandas method. But it's listed in the transform section.** This is fine per the keyword definition (line 314: "language keywords + pandas methods") but the drill context is odd. A lambda appears inside an apply: "df['return'].apply(lambda x: x * 100)". In this case "apply" and "lambda" are both keywords. But "x" is a variable — not blanked. The full line blanked at Level 2: "df['return'].a____( l_____ x: x * 100)". **Is the colon after lambda's parameter visible? It's punctuation, so yes per line 320. But it's semantically part of the lambda syntax.** Edge case.
- **"pct_change" — underscore collision.**
- **"rolling" is often chained: df['close'].rolling(50).mean(). Is "mean" a keyword here? It's a pandas method. But it's not listed in the transform section.** The skill says keywords are "pandas methods" generically but sections list specific methods. **Does the system only blank methods listed in the current section, or ALL pandas methods?**

**Verdict:** Keyword scope ambiguity — section-specific or global? Underscore collision continues.

---

### Scenario 23 — Python, NVDA, "compare to sector", Level 2, section: visualize. User types "lang" to switch to SQL.

**Simulation:** User starts Python visualize drills. Mid-session types "lang".

**Flow:** Line 224: "lang — Switch between SQL and Python." Same command-vs-answer collision.

**Issues found:**
- **All command collision issues from Scenario 9 apply.**
- **When switching from Python to SQL: does the session reset? Does the user keep their score? Do they re-pick a section from the SQL menu? Keep the same stock/objective?** No transition rules defined.
- **"lang" at Level 2: user types one letter at a time. "l" could be a keyword answer (e.g., "loc", "lambda", "left" in LEFT JOIN). The system can't distinguish "l" (answer) from the start of "lang" (command).** This is the exact same fundamental flaw.
- **After switching to SQL, does the section "visualize" persist? SQL has no "visualize" section.** This is edge case 25 but happens naturally here too.

**Verdict:** Language switch is completely underspecified. Inherits all command collision problems.

---

### Scenario 24 — User types "help" immediately without answering setup questions.

**Simulation:** CodeRecall shows the SESSION START prompt. User types "help" instead of answering.

**Flow:** Line 214: "Show these if user types 'help' or 'commands'." But the SESSION COMMANDS are designed for mid-session use. During SESSION START, the user hasn't picked a language yet.

**Issues found:**
- **The skill doesn't define when commands are available.** Are they available during setup? Only during drills? Always? If "help" shows the command list during setup, the commands reference "switch" (change section) and "level" (change level) which don't apply yet because nothing has been set.
- **After showing help, does the system re-show the SESSION START prompt? Or does it wait silently?** No re-prompt behavior defined.
- **If the user types "help" during a drill, the help menu itself would break the drill flow.** The skill says "never break the flow with text walls" (line 291) but the help menu IS a text wall.

**Verdict:** Help behavior during setup is undefined. Help during drills conflicts with the "keep it fast" rule.

---

### Scenario 25 — User picks SQL + "visualize" (which only exists in Python).

**Simulation:** User enters sql, picks stock and objective, picks level. Section menu shows SQL sections. User types "visualize".

**Flow:** The SQL section menu (line 44-58) does not include "visualize". The user typed an invalid section.

**Issues found:**
- **No input validation defined.** The skill doesn't say what to do when the user types an invalid section name. Does it show an error? Re-show the menu? Treat it as a typo?
- **No "invalid input" handling anywhere in the skill.** Not for bad section names, not for bad level numbers, not for invalid tickers, not for unrecognized commands. The skill only defines the happy path.
- **Similarly: what if the user types "5" for level? Or "sql" when already in SQL? Or a completely random string like "asdfgh"?** Zero error handling.

**Verdict:** No error handling or input validation defined anywhere in the entire skill.

---

## CONSOLIDATED REPORT

---

## CRITICAL FIXES (must fix -- these break the game or create ambiguous states)

### 1. COMMAND vs. ANSWER COLLISION (Scenarios 9, 10, 12, 13, 20, 23)
**Location:** Step 2 (line 136), SESSION COMMANDS (line 214)
**Problem:** Commands (stop, done, switch, level, lang, shuffle, score, help) and drill answers occupy the same input space. At Levels 1-2, single-letter input "s" could be an answer or the start of "switch"/"stop"/"score"/"shuffle". At Level 3, "merge" is both a valid keyword answer AND a section name. There is NO disambiguation mechanism.
**Fix needed:** Add a command prefix (e.g., "/" or "!") so "/stop" is a command and "s" is always an answer. OR define that commands are ONLY processed between drills (after Step 4 completes, before Step 1 of the next drill). The skill must explicitly state when commands are recognized.

### 2. PYTHON KEYWORD/NON-KEYWORD RULES MISSING (Scenarios 14, 15, 16, 17, 18, 20, 21, 22)
**Location:** "What counts as a keyword" section (lines 313-320)
**Problem:** The non-keyword list (lines 317-320) only gives SQL examples. Python has unique challenges: dot notation (df.method), underscores in method names (drop_duplicates, pct_change, value_counts), attributes vs methods (shape vs head()), bracket notation (df[condition]), string arguments that are method names ('sum' in agg), library prefixes (pd, plt, sns), chained methods. None of these are addressed.
**Fix needed:** Add a complete Python-specific keyword/non-keyword section parallel to the SQL one. Must explicitly define:
- Whether "pd.", "plt.", "sns." are visible prefixes or part of the keyword
- How underscored method names are blanked (use a different blank character?)
- Whether attributes (shape, dtypes) are keywords
- Whether bracket notation has any blankable element
- Whether library names (pandas, matplotlib) are visible

### 3. MULTI-WORD / COMPOUND KEYWORD DEFINITION (Scenarios 4, 7, 11)
**Location:** Keyword definition (lines 313-315), drill bank (line 299)
**Problem:** The skill treats "GROUP BY", "ORDER BY", "CASE WHEN", "INNER JOIN", "LEFT JOIN", "PARTITION BY", "DATE_TRUNC", etc. inconsistently. The section list (lines 50-57) shows some as single items. The drill bank example (line 305) only shows single-word keywords. Is "GROUP BY" one keyword (user types one letter "g" or full "GROUP BY") or two keywords (user types "g" then "b" or "GROUP" then "BY")?
**Fix needed:** Add an explicit rule: "Multi-word SQL keywords (GROUP BY, ORDER BY, INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN, CASE WHEN, PARTITION BY) are treated as [ONE keyword / TWO separate keywords]. When treated as one, the blank spans the full phrase including the space."

### 4. QUESTION GENERATION MISSING BRANCH (Scenarios 3, 5)
**Location:** QUESTION GENERATION (lines 260-276)
**Problem:** Only two generation branches exist: (a) stock + objective provided, (b) stock skipped. Missing branches: (c) stock provided + objective skipped, (d) stock skipped + objective provided (nonsensical but possible). The skill also doesn't say whether skipping stock auto-skips objective.
**Fix needed:** Add a third branch: "If user entered a stock but skipped objective: Generate drills using the stock's typical financial data (price, volume, earnings, balance sheet) with the selected section's keywords. Use realistic table and column names." Also add: "If stock is 'skip', objective is automatically 'skip'."

### 5. NO INPUT VALIDATION OR ERROR HANDLING (Scenario 25, implicit in all)
**Location:** Entire skill
**Problem:** The skill defines zero error handling. No guidance for: invalid section names, invalid level numbers, unrecognized commands, malformed tickers, empty input, gibberish input. Every interaction is happy-path only.
**Fix needed:** Add an ERROR HANDLING section: "If the user enters an unrecognized command or invalid input, show: '?? Try again. Type help for commands.' Do not break the drill flow. During setup, re-show the relevant question."

### 6. SESSION START COUNT MISMATCH (Scenario 1)
**Location:** Line 19 vs lines 24-33 vs line 40
**Problem:** Line 19 says "ask these 3 things" but 4 inputs are shown (language, stock, objective, level), and the section menu (line 40) is a 5th step. The ordering is ambiguous — does the section menu appear between language and stock? After level? The skill says "When the user picks a language, show the section menu" (line 40) which implies it's the second screen, but the SESSION START block shows all 4 questions together.
**Fix needed:** Either change line 19 to "ask these 5 things" and include the section in the SESSION START block, or explicitly define the flow as: Screen 1 = language + stock + objective + level (4 questions), Screen 2 = section menu. Make the ordering unambiguous.

---

## NICE-TO-HAVE FIXES (improve the experience but don't break the game)

### 7. MAX WRONG ATTEMPTS / HINT SYSTEM (Scenario 10)
**Location:** Step 3 (lines 142-155)
**Problem:** No limit on wrong attempts per keyword. User can get stuck forever with accumulating penalties. No hint after N wrong. No "give up" option.
**Suggestion:** Add: "After 3 wrong attempts, show a hint (reveal one more letter). After 5 wrong attempts, auto-reveal the keyword with 0 points. Show: 'Revealed: SELECT | 0 pts | Study this one.'"

### 8. 10-DRILL LIMIT EDGE CASE (Scenario 2)
**Location:** QUESTION GENERATION (line 263)
**Problem:** "Generate 10 drills" but no rule for what happens when all 10 are completed and the user hasn't typed "stop."
**Suggestion:** Add: "After all 10 drills in a set are completed, generate 10 more. Increase difficulty slightly by combining section keywords (e.g., acquire drills that also require aggregate keywords)." Or: "After 10 drills, show a checkpoint with stats and ask to continue or stop."

### 9. WRONG ANSWER SCORE DISPLAY (Scenario 10)
**Location:** Step 3, wrong answer block (lines 153-155)
**Problem:** Correct answers show points and streak (line 148-149). Wrong answers only show "Try again" — no penalty shown, no updated score.
**Suggestion:** Update wrong answer display to: "Try again | -1 pt | Streak: 0 | Total: 42"

### 10. LEVEL-SWITCH INTERACTION (Scenario 12)
**Location:** SESSION COMMANDS (line 222)
**Problem:** "level" command exists but the interaction after typing it is undefined. Does it cycle? Prompt for a number? Show the level menu again?
**Suggestion:** Add: "When user types 'level': show the 3 levels with current level marked. User types 1, 2, or 3. Current drill restarts at the new level. Score and streak are preserved."

### 11. LANGUAGE-SWITCH TRANSITION (Scenario 23)
**Location:** SESSION COMMANDS (line 224)
**Problem:** "lang" command exists but switching from Python to SQL (or vice versa) has no defined behavior. Score preservation, section re-pick, stock/objective persistence all undefined.
**Suggestion:** Add: "When user types 'lang': switch to the other language. Show that language's section menu. Preserve stock, objective, level, and cumulative score. Reset section-specific stats."

### 12. MASTERY THRESHOLD UNDEFINED (Scenario 13)
**Location:** SESSION END (line 245)
**Problem:** "Keywords Mastered" and "Needs Work" lists have no defined thresholds.
**Suggestion:** Add: "Mastered = keyword answered correctly on first attempt 3+ times. Needs Work = keyword answered wrong 50% or more of attempts, with minimum 2 attempts."

### 13. SHUFFLE WEIGHTING (Scenario 6, 19)
**Location:** Shuffle mechanic (lines 58, 77)
**Problem:** No guidance on whether shuffle is uniform random or weighted toward weak areas.
**Suggestion:** Add: "Shuffle mode: random selection from all sections. If session stats exist, weight toward sections with lower accuracy."

### 14. DEPRECATED PANDAS METHOD (Scenario 20)
**Location:** Python merge section (line 73)
**Problem:** "append" was removed in pandas 2.0. Teaching it creates bad habits.
**Suggestion:** Replace "append" with "concat" (which is already listed) or "join" (also listed). Or replace with "pd.concat" if you need a 4th item.

### 15. HALF-VISIBLE BLANKING RULE PRECISION (Scenario 1)
**Location:** Level 1 description (line 91)
**Problem:** "Show every other letter" is ambiguous — show odd positions (1,3,5) or even positions (2,4,6)?
**Suggestion:** Clarify: "Show characters at odd positions (1st, 3rd, 5th...) and blank even positions. Example: SELECT -> S_L_C_, FROM -> F_O_, WHERE -> W_E_E."

### 16. HELP DURING SETUP AND DRILLS (Scenario 24)
**Location:** SESSION COMMANDS (line 214)
**Problem:** Help availability during setup is undefined. Help during drills creates a text wall that breaks flow.
**Suggestion:** Add: "Help is available at any time. During setup, show only the setup instructions. During drills, show a compact single-line: 'stop | switch | level | lang | shuffle | score'. Resume the current drill after showing help."

### 17. DIFFICULTY PROGRESSION WITHIN SESSION (Scenario 8)
**Location:** QUESTION GENERATION (line 260)
**Problem:** No guidance on ordering drills by difficulty. Drill 1 could be harder than drill 10.
**Suggestion:** Add: "Order drills from fewer keywords to more keywords within a set. Drill 1 should have 3-4 keywords, drill 10 should have 6-8."

---

## WORKING WELL (solid -- do not touch)

### 1. CORE GAME LOOP (lines 84-176)
The Step 1-2-3-4-5 loop is clean, well-defined for the happy path, and the rhythm (present -> type -> score -> complete -> repeat) is solid. The scoring after each keyword keeps engagement high. The auto-advance design is correct.

### 2. SCORING SYSTEM (lines 186-208)
Point values per level are well-balanced. Speed bonus tiers are reasonable. Streak multiplier creates good momentum incentive. Wrong answer penalties scale appropriately with level (0 for training, -1 for practice, -3 for interview mode). This is well-designed and gamification-sound.

### 3. SESSION END REPORT (lines 230-256)
The end-of-session stats display is comprehensive: time, drills completed, accuracy, best streak, total score, mastered keywords, weak keywords, recommendation. The format is clear and motivating. Good information density.

### 4. SQL SECTION TAXONOMY (lines 44-58)
The 7 SQL sections cover the real interview surface area well. The keyword lists per section are accurate and comprehensive. The progression from acquire (basic SELECT) to advanced (CTEs, subqueries) is logical. Section names are intuitive.

### 5. LEVEL DESIGN (lines 90-133)
The three-level progression (half visible -> first letter -> full recall) is pedagogically sound. It mirrors spaced repetition difficulty curves. The visual examples for each level are clear and immediately understandable. The instruction "Type the first letter" vs "Type the full keyword" is clean differentiation.

### 6. DRILL BANK STRUCTURE (lines 297-320)
The JSON structure for drills is clean and sufficient. Section, prompt, answer, keywords, language — all the necessary fields are present. The SQL keyword/non-keyword distinction is clear for SQL (reserved words = keywords, everything else = visible).

### 7. CRITICAL RULES (lines 278-294)
Rules 1-7 establish the right tone. "NOT a tutor", "NOT conversations", "one keyword at a time", "always show score", "auto-advance", "keep it fast", "emojis are functional" — these enforce the product vision and prevent scope creep. Well-written guardrails.

### 8. QUESTION GENERATION WITH STOCK CONTEXT (lines 260-272)
The example for TSLA/$315/acquire is excellent. It shows how abstract objectives become concrete, realistic drills. The 5 example drills all feel like real analyst work, not textbook exercises. This is the skill's strongest differentiator.

### 9. VISUAL FORMATTING
The emoji usage is functional and consistent throughout. The box-drawing characters (lines like "---") create clean separation. The code blocks are well-formatted. The overall visual hierarchy is strong.

---

## PRIORITY ORDER FOR FIXES

If implementing fixes in order of impact:

1. **Command vs. Answer Collision** (#1) — This breaks the game at a fundamental interaction level. Nothing else matters if the user can't reliably issue commands.
2. **Python Keyword Rules** (#2) — Half the game (all Python drills) is underspecified.
3. **Compound Keyword Definition** (#3) — Affects every SQL drill with multi-word keywords.
4. **Missing Generation Branch** (#4) — Common user path (stock + skip objective) has no rule.
5. **Input Validation** (#5) — Every invalid input creates an undefined state.
6. **Session Start Ordering** (#6) — First impression confusion for implementers.

Everything in NICE-TO-HAVE can be addressed in a second pass without breaking existing functionality.
