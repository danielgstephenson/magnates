/* global io */

window.range = n => [...Array(n).keys()]

window.client = (() => {
  const paper = window.Snap(window.innerWidth, window.innerHeight)
  const group = paper.group()

  const socket = io({ transports: ['websocket'], upgrade: false })
  const templates = {}
  const components = []
  const backs = []
  const hiddens = []
  const facedowns = []
  const handlers = {}
  let seed = null

  const unique = arr => {
    const s = new Set(arr)
    return [...s]
  }

  // Disable Right Click Menu
  document.oncontextmenu = () => false

  // Setup Zoom-Pan-Drag
  const paperError = (error, paper) => {
    if (error) console.error(error, paper)
  }
  paper.zpd({ zoom: true, pan: false, drag: false }, paperError)
  paper.zoomTo(0.2, 200, null, function (err) {
    if (err) console.error(err)
    else console.warn('zoom complete')
    paper.panTo(800, 500, 200, null, function (err) {
      if (err) console.error(err)
      else console.warn('pan complete')
    })
  })

  paper.mousedown(event => {
    if (event.button === 2) paper.zpd({ pan: true }, paperError)
  })

  paper.mouseup(event => {
    if (event.button === 2) paper.zpd({ pan: false }, paperError)
  })

  window.setSide = function (component, side) {
    const hidden = hiddens[component.data('hiddenId')]
    const back = backs[component.data('backId')]
    const facedown = facedowns[component.data('facedownId')]
    console.log('setSide', side)
    if (side === 'hidden') {
      back.attr({ opacity: 0 })
      hidden.attr({ opacity: 1 })
      facedown.attr({ opacity: 0 })
      back.node.style.display = 'none'
      hidden.node.style.display = 'block'
      facedown.node.style.display = 'none'
      component.data('side', 'hidden')
    }
    if (side === 'front') {
      back.attr({ opacity: 0 })
      hidden.attr({ opacity: 0 })
      facedown.attr({ opacity: 0 })
      back.node.style.display = 'none'
      hidden.node.style.display = 'none'
      facedown.node.style.display = 'none'
      component.data('side', 'front')
    }
    if (side === 'back') {
      back.attr({ opacity: 1 })
      hidden.attr({ opacity: 0 })
      facedown.attr({ opacity: 0 })
      back.node.style.display = 'block'
      hidden.node.style.display = 'none'
      facedown.node.style.display = 'none'
      component.data('side', 'back')
    }
    if (side === 'facedown') {
      back.attr({ opacity: 0 })
      hidden.attr({ opacity: 0 })
      facedown.attr({ opacity: 1 })
      back.node.style.display = 'none'
      hidden.node.style.display = 'none'
      facedown.node.style.display = 'block'
      component.data('side', 'facedown')
    }
  }

  window.flipComponent = function (component) {
    console.log('flip')
    const oldside = component.data('side')
    console.log('oldSide = ' + oldside)
    if (oldside === 'back') window.setSide(component, 'front')
    if (oldside === 'facedown') window.setSide(component, 'hidden')
    if (oldside === 'front') window.setSide(component, 'hidden')
    if (oldside === 'hidden') window.setSide(component, 'front')
    console.log('newSide = ' + component.data('side'))
    component.data('moved', true)
  }

  const addFragment = (fragment, x, y, rotation) => {
    const svg = fragment.select('g')
    paper.append(svg)
    const children = paper.children()
    const component = children[children.length - 1]
    const width = component.getBBox().width
    const height = component.getBBox().height
    const startX = x - 0.5 * width
    const startY = y - 0.5 * height
    const startMatrix = component.transform().localMatrix.translate(startX, startY)
    startMatrix.rotate(rotation, width / 2, height / 2)
    component.transform(startMatrix)
    group.add(component)
    return component
  }

  const addComponent = (description) => {
    const { x, y, rotation, type, clones, file, details, side, player } = description
    const template = templates[file]
    const startMatrix = template.transform().localMatrix.translate(x, y)
    window.range(clones + 1).forEach(i => {
      const component = template.clone()
      group.add(component)
      component.node.style.display = 'block'
      component.transform(startMatrix)
      component.transform(`${component.transform().local}r${rotation}`)
      components.push(component)
      component.smartdrag()
      component.data('id', components.length - 1)
      component.data('file', file)
      component.data('type', type)
      component.data('details', details)
      component.data('twoSided', false)
      component.data('player', player)
      let twoSided = false
      let hidden, facedown, back
      if (type === 'card') {
        hidden = templates['card/card-hidden'].clone()
        if (file.substr(0, 17) === 'card/location-col') {
          facedown = templates['card/location-col-back'].clone()
          back = templates['card/location-col-back'].clone()
        } else if (file.substr(0, 17) === 'card/location-row') {
          facedown = templates['card/location-row-back'].clone()
          back = templates['card/location-row-back'].clone()
        } else {
          facedown = templates['card/card-back'].clone()
          back = templates['card/card-back'].clone()
        }
        twoSided = true
      }
      if (file === 'board/nametag') {
        const textbox = component.text(component.getBBox().width / 2, 760, 'Name Tag')
        textbox.attr({ 'font-size': 100, 'text-anchor': 'middle' })
      }
      if (file === 'board/screen-bottom-left') {
        hidden = templates['board/screen-bottom-left-hidden'].clone()
        facedown = templates['board/screen-bottom-left-back'].clone()
        back = templates['board/screen-bottom-left-back'].clone()
        twoSided = true
      }
      if (file === 'board/screen-bottom-right') {
        hidden = templates['board/screen-bottom-right-hidden'].clone()
        facedown = templates['board/screen-bottom-right-back'].clone()
        back = templates['board/screen-bottom-right-back'].clone()
        twoSided = true
      }
      if (file === 'board/screen-top-left') {
        hidden = templates['board/screen-top-left-hidden'].clone()
        facedown = templates['board/screen-top-left-back'].clone()
        back = templates['board/screen-top-left-back'].clone()
        twoSided = true
      }
      if (file === 'board/screen-top-right') {
        hidden = templates['board/screen-top-right-hidden'].clone()
        facedown = templates['board/screen-top-right-back'].clone()
        back = templates['board/screen-top-right-back'].clone()
        twoSided = true
      }
      if (file === 'board/ready') {
        hidden = templates['board/ready-back'].clone()
        facedown = templates['board/ready-back'].clone()
        back = templates['board/ready-back'].clone()
        twoSided = true
      }
      if (twoSided) {
        component.data('twoSided', true)
        component.data('side', 'front')

        hiddens.push(hidden)
        component.data('hiddenId', hiddens.length - 1)
        group.add(hidden)
        hidden.node.style.display = 'block'
        component.append(hidden)
        hidden.node.style.display = 'none'
        hidden.attr({ opacity: 0 })
        hidden.transform('t0,0')

        facedowns.push(facedown)
        component.data('facedownId', facedowns.length - 1)
        group.add(facedown)
        facedown.node.style.display = 'block'
        component.append(facedown)
        facedown.node.style.display = 'none'
        facedown.attr({ opacity: 0 })
        facedown.transform('')

        backs.push(back)
        component.data('backId', backs.length - 1)
        group.add(back)
        back.node.style.display = 'block'
        component.append(back)
        back.node.style.display = 'none'
        back.attr({ opacity: 0 })
        back.transform('')

        if (side === 'facedown') window.setSide(component, 'facedown')
        if (side === 'hidden') window.setSide(component, 'hidden')
        if (side === 'back') window.setSide(component, 'back')
      }
    })
  }

  const setupTemplate = (file, descriptions, updates, numTemplates) => fragment => {
    const template = addFragment(fragment, 0, 0, 0)
    template.node.style.display = 'none'
    templates[file] = template
    if (Object.keys(templates).length === numTemplates) {
      descriptions.map(description => addComponent(description))
      updates.map(processUpdate)
      setInterval(updateServer, 400)
    }
  }

  const start = (descriptions, updates) => {
    let files = unique(descriptions.map(item => item.file))
    const backFiles = [
      'card/card-back', 'card/card-hidden',
      'card/location-row-back', 'card/location-col-back',
      'board/screen-bottom-left-back', 'board/screen-bottom-left-hidden',
      'board/screen-bottom-right-back', 'board/screen-bottom-right-hidden',
      'board/screen-top-left-back', 'board/screen-top-left-hidden',
      'board/screen-top-right-back', 'board/screen-top-right-hidden',
      'board/ready-back'
    ]
    files = files.concat(backFiles)
    files.map(file => window.Snap.load(`assets/${file}.svg`, setupTemplate(file, descriptions, updates, files.length)))
  }

  const describe = options => {
    const description = { file: null, x: 0, y: 0, type: 'bit', clones: 0, rotation: 0, player: 0 }
    return Object.assign(description, options)
  }

  const on = (name, handler) => (handlers[name] = handler)

  const updateServer = () => {
    const msg = { updates: [], seed: seed }
    components.forEach(component => {
      if (component.data('moved')) {
        const bitUpdate = {
          id: component.data('id'),
          side: component.data('side'),
          local: component.transform().local,
          text: ''
        }
        if (component.data('file') === 'board/nametag') {
          const children = component.children()
          const textbox = children[children.length - 1]
          bitUpdate.text = textbox.attr('text')
        }
        if (handlers.moved) {
          Object.assign(bitUpdate, handlers.moved(component))
        }
        msg.updates.push(bitUpdate)
        component.data('moved', false)
      }
    })
    if (msg.updates.length > 0) socket.emit('updateServer', msg)
  }

  const processUpdate = update => {
    if (update) {
      const component = components[update.id]
      component.stop()
      component.animate({ transform: update.local }, 400)
      if (handlers.update) handlers.update(update)
      if (update.side === 'facedown') window.setSide(component, 'facedown')
      if (update.side === 'hidden') window.setSide(component, 'back')
      if (update.side === 'front') window.setSide(component, 'front')
      if (component.data('file') === 'board/nametag') {
        const children = component.children()
        const textbox = children[children.length - 1]
        textbox.attr({ text: update.text })
      }
    }
  }

  socket.on('connect', () => {
    console.log('sessionid =', socket.id)

    socket.on('updateClient', msg => {
      console.log('updateClient')
      if (msg.seed === seed) msg.updates.map(processUpdate)
    })

    socket.on('setup', msg => {
      if (!seed) {
        seed = msg.seed
        Math.seedrandom(seed)
        console.log('seed = ' + seed)
        window.setup(msg)
        paper.panTo(-500, 1100)
      } else {
        console.log('Restart Needed')
      }
    })
  })

  return { describe, start, bits: components, on }
})()
