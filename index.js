pub fn sqrt_ratio(
  u: &FieldElement,
  v: &FieldElement
) -> (u8, FieldElement) {
  // Using the same trick as in ed25519 decoding, we merge the
  // inversion, the square root, and the square test as follows.
  //
  // To compute sqrt(α), we can compute β = α^((p+3)/8).
  // Then β^2 = ±α, so multiplying β by sqrt(-1) if necessary
  // gives sqrt(α).
  //
  // To compute 1/sqrt(α), we observe that
  //    1/β = α^(p-1 - (p+3)/8) = α^((7p-11)/8)
  //                            = α^3 * (α^7)^((p-5)/8).
  //
  // We can therefore compute sqrt(u/v) = sqrt(u)/sqrt(v)
  // by first computing
  //    r = u^((p+3)/8) v^(p-1-(p+3)/8)
  //      = u u^((p-5)/8) v^3 (v^7)^((p-5)/8)
  //      = (uv^3) (uv^7)^((p-5)/8).
  //
  // If v is nonzero and u/v is square, then r^2 = ±u/v,
  //                                     so vr^2 = ±u.
  // If vr^2 =  u, then sqrt(u/v) = r.
  // If vr^2 = -u, then sqrt(u/v) = r*sqrt(-1).
  //
  // If v is zero, r is also zero.

  let v3 = &v.square()  * v;
  let v7 = &v3.square() * v;
  let mut r = &(u * &v3) * &(u * &v7).pow_p58();
  let check = v * &r.square();

  let correct_sign_sqrt = check.ct_eq(   u);
  let flipped_sign_sqrt = check.ct_eq(&(-u));

  let r_prime = &constants::SQRT_M1 * &r;
  r.conditional_assign(&r_prime, flipped_sign_sqrt);

  let was_nonzero_square = correct_sign_sqrt | flipped_sign_sqrt;

  (was_nonzero_square, r)
}
