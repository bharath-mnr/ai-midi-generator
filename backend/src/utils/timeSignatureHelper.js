const calculateSubdivisions = (numerator, denominator) => {
  const subdivisions = numerator * (16 / denominator);
  if (!Number.isInteger(subdivisions)) {
    throw new Error(`Invalid time signature: ${numerator}/${denominator}`);
  }
  return subdivisions;
};

module.exports = { calculateSubdivisions };