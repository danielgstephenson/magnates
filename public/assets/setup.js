const getRowOrigins = (n, y, tableWidth) => window.range(n).map(i => {
  const alpha = (i + 1) / (n + 1)
  const x = -tableWidth * alpha + tableWidth * (1 - alpha)
  return [x, y]
})

const describeRow = (file, x, y, type, n, length, clones = 0, side = 'front') => window.range(n).map(i => {
  const weight = n > 1 ? i / (n - 1) : 0
  const myX = (x - 0.5 * length) * (1 - weight) + (x + 0.5 * length) * weight
  return window.client.describe({ file, x: myX, y, type, side, clones })
})

const describeColumn = (file, x, y, type, n, length, clones = 0, side = 'front') => window.range(n).map(i => {
  const weight = n > 1 ? i / (n - 1) : 0
  const myY = (y - 0.5 * length) * (1 - weight) + (y + 0.5 * length) * weight
  return window.client.describe({ file, x, y: myY, type, side, clones })
})

const describePortfolio = (x, y, player) => {
  let descriptions = []
  const sgn = Math.sign(y)
  descriptions = []
  if (sgn > 0) {
    descriptions.push(window.client.describe({ file: 'board/screen-bottom-left', x: x - 420, y: y, type: 'screen', player: player }))
    descriptions.push(window.client.describe({ file: 'board/screen-bottom-right', x: x + 420, y: y, type: 'screen', player: player }))
  } else {
    descriptions.push(window.client.describe({ file: 'board/screen-top-left', x: x - 420, y: y, type: 'screen', player: player }))
    descriptions.push(window.client.describe({ file: 'board/screen-top-right', x: x + 420, y: y, type: 'screen', player: player }))
  }
  descriptions.push(window.client.describe({ file: 'board/nametag', x: x, y: y + sgn * 490, type: 'board' }))
  descriptions.push(window.client.describe({ file: 'board/ready', x: x, y: y + sgn * 610, type: 'screen', player: player }))
  descriptions.push(window.client.describe({ file: 'board/label-location', x: x - 420, y: y - sgn * 295, type: 'board', player: player }))
  descriptions.push(window.client.describe({ file: 'board/label-bid', x: x + 420, y: y - sgn * 295, type: 'board', player: player }))
  descriptions = descriptions.concat(describeRow('gold/1', x + 420, y - sgn * 20, 'bit', 6, 450))
  descriptions = descriptions.concat(describeRow('gold/2', x + 205, y + sgn * 180, 'bit', 1, 0))
  descriptions = descriptions.concat(describeRow('gold/3', x + 400, y + sgn * 180, 'bit', 1, 0))
  descriptions = descriptions.concat(describeRow('gold/5', x + 620, y + sgn * 180, 'bit', 1, 0))
  descriptions = descriptions.concat(describeRow('gold/bond', x - 580, y + sgn * 500, 'bit', 3, 300))
  window.range(8).forEach(i => {
    descriptions.push(window.client.describe({ file: `card/location-col-${i + 1}`, x: x - 740 + i * 90, y: y - sgn * 10, type: 'card' }))
  })
  window.range(8).forEach(i => {
    descriptions.push(window.client.describe({ file: `card/location-row-${i + 1}`, x: x - 740 + i * 90, y: y + sgn * 120, type: 'card' }))
  })
  descriptions = descriptions.concat(window.client.describe({ file: 'card/stock-a', x: x - 600, y: y + sgn * 290, type: 'card' }))
  descriptions = descriptions.concat(window.client.describe({ file: 'card/stock-b', x: x - 400, y: y + sgn * 290, type: 'card' }))
  descriptions = descriptions.concat(window.client.describe({ file: 'card/stock-c', x: x - 200, y: y + sgn * 290, type: 'card' }))
  return (descriptions)
}

const describeBank = (x, y) => {
  let descriptions = []
  descriptions = descriptions.concat(describeRow('gold/1', x, y - 650, 'bit', 3, 300, 10))
  descriptions = descriptions.concat(describeRow('gold/2', x, y - 500, 'bit', 3, 300, 10))
  descriptions = descriptions.concat(describeRow('gold/3', x, y - 340, 'bit', 3, 310, 10))
  descriptions = descriptions.concat(describeRow('gold/4', x, y - 170, 'bit', 3, 320, 10))
  descriptions = descriptions.concat(describeRow('gold/5', x, y - 0, 'bit', 3, 320, 10))
  descriptions = descriptions.concat(describeRow('gold/4', x, y + 170, 'bit', 3, 320, 10))
  descriptions = descriptions.concat(describeRow('gold/3', x, y + 340, 'bit', 3, 310, 10))
  descriptions = descriptions.concat(describeRow('gold/2', x, y + 500, 'bit', 3, 300, 10))
  descriptions = descriptions.concat(describeRow('gold/1', x, y + 650, 'bit', 3, 300, 10))
  return (descriptions)
}

const describeBonds = (x, y, numPlayers) => {
  let descriptions = []
  descriptions = descriptions.concat(describeColumn('gold/bond', x - 150, y, 'bit', 6, 800, numPlayers))
  descriptions = descriptions.concat(describeColumn('gold/bond', x - 0, y, 'bit', 6, 800, numPlayers))
  descriptions = descriptions.concat(describeColumn('gold/bond', x + 150, y, 'bit', 6, 800, numPlayers))
  return (descriptions)
}

const describeCompany = (x, y, numPlayers, letter = 'a') => {
  let descriptions = []
  const cardName = 'card/stock-' + letter
  const unitName = 'unit/' + letter
  descriptions = descriptions.concat(describeRow(cardName, x - 150, y, 'card', 5 * numPlayers, 0))
  descriptions = descriptions.concat(describeRow(cardName, x + 0, y, 'card', 5 * numPlayers, 0))
  descriptions = descriptions.concat(describeRow(cardName, x + 150, y, 'card', 5 * numPlayers, 0))
  descriptions = descriptions.concat(describeRow(unitName, x, y + 230, 'bit', 5, 350))
  descriptions = descriptions.concat(describeRow(unitName, x, y + 380, 'bit', 5, 350))
  return (descriptions)
}

const getLayer = element => {
  switch (element.type) {
    case 'board': return 1
    case 'card': return 2
    case 'bit': return 3
    case 'screen': return 4
    default: return 0
  }
}

const compareLayers = (a, b) => {
  const aLayer = getLayer(a)
  const bLayer = getLayer(b)
  return aLayer - bLayer
}

window.setup = message => {
  const numPlayers = message.config.numPlayers
  const tableWidth = numPlayers < 4 ? 3500 : numPlayers < 9 ? 4000 : 5000
  const numBottomRowPlayers = Math.round(numPlayers / 2)
  const numTopRowPlayers = numPlayers - numBottomRowPlayers
  const topRowOrigins = getRowOrigins(numTopRowPlayers, -1400, tableWidth)
  const bottomRowOrigins = getRowOrigins(numBottomRowPlayers, 1400, tableWidth)
  const origins = topRowOrigins.concat(bottomRowOrigins)
  let descriptions = []
  descriptions = descriptions.concat(window.client.describe({ file: 'board/map', x: 0, y: 0, type: 'board' }))
  descriptions = descriptions.concat(window.client.describe({ file: 'card/stock-a', x: 150, y: 400, type: 'card' }))
  const A = 900
  const B = -780
  const C = 600
  descriptions = descriptions.concat(describeCompany(A, B + 0 * C, numPlayers, 'a'))
  descriptions = descriptions.concat(describeCompany(A, B + 1 * C, numPlayers, 'b'))
  descriptions = descriptions.concat(describeCompany(A, B + 2 * C, numPlayers, 'c'))
  descriptions = descriptions.concat(describeBank(1500, 0))
  descriptions = descriptions.concat(describeBonds(-1550, 0, numPlayers))
  origins.forEach((origin, i) => {
    const x = origin[0]
    const y = origin[1]
    const portfolio = describePortfolio(x, y, i + 1)
    descriptions = descriptions.concat(portfolio)
  })
  console.log(descriptions)
  descriptions.sort(compareLayers)
  window.client.start(descriptions, message.state)
}
