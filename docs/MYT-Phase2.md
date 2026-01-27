@Workspace
Role: Database Mathematician.
Task: Implement the DOTS Scoring algorithm as an IMMUTABLE stored function in PostgreSQL.

**Goal:** Encapsulate the complex math in the database (Stored Function) so the frontend never touches the coefficients. This prevents "Client-Side Hacking" and floating-point errors, ensuring the "Twin" match is mathematically rigorous.

1. Create a function `calculate_dots(bw numeric, total numeric, gender text)` returning numeric.
2. It must use the following Polynomial Formula: 
   `DOTS = (total * 500) / (A*x^0 + B*x^1 + C*x^2 + D*x^3 + E*x^4 + F*x^5)`
   (Where x is body weight).

3. You MUST use these exact coefficients inside a CASE statement based on gender:

   **MALE:**
   A: 47.46178854
   B: 8.472061379
   C: 0.07369410346
   D: -0.001395833811
   E: 7.07665973070743e-6
   F: -1.20804336482315e-8

   **FEMALE:**
   A: -125.4255398
   B: 13.71219419
   C: -0.03307250631
   D: -0.001050400051
   E: 9.38773881462799e-6
   F: -2.3334613884954e-8

4. Update the `profiles` table to make `dots_score` a GENERATED COLUMN using this function.