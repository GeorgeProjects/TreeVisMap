module.exports = (req, res) => {
  let svgData = req.query.data
  console.log('svgData', svgData)
  res.json(svgData)
};
