const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const sizeFactor : number = 2.9
const strokeFactor : number = 90
const foreColor : string = "#673AB7"
const backColor : string = "#bdbdbd"
const nodes : number = 5
const circles : number = 10

const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)
const maxScale : Function = (scale : number, i : number, n : number) : number => Math.max(0, scale - i / n)
const divideScale : Function = (scale : number, i : number, n : number) : number => {
    const mxsc : number = maxScale(scale, i, n)
    return Math.min(1 / n, mxsc)
}
const mirrorValue : Function = (scale : number, a : number, b : number) : number => {
    const k : number = scaleFactor(scale)
    return (1 - k) / a + k / b
}
const updateValue : Function = (scale : number, dir : number, a : number, b : number) : number => {
    return mirrorValue(scale, a , b) * dir * scGap
}

const drawSemiCircle : Function = (context : CanvasRenderingContext2D, r : number, sc : number) => {
    context.beginPath()
    for (var i = -90; i <= -90 + 180 * sc; i++) {
        const x : number = r * Math.cos(i * Math.PI/180)
        const y : number = r * Math.sin(i * Math.PI/180)
        if (i == -90) {
            context.moveTo(x, y)
        } else {
            context.lineTo(x, y)
        }
    }
    context.stroke()
}

const drawSCLNode : Function = (context : CanvasRenderingContext2D,  i : number, scale : number) => {
    const gap : number = w / (nodes + 1)
    const size : number = gap / sizeFactor
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    const yGap : number = size / circles
    context.lineCap = 'round'
    context.lineWidth = Math.min(w, h) / strokeFactor
    context.strokeStyle = foreColor
    context.save()
    context.translate(gap * (i + 1), h / 2)
    context.rotate((Math.PI / 3) * sc1)
    for (var j = 0; j < circles;j ++) {
        context.save()
        context.translate(0, -size + yGap * j)
        drawSemiCircle(context, yGap, divideScale(scale, j, circles))
        context.restore()
    }
    context.restore()
}

class SemiCircleLineStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor

    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : SemiCircleLineStage = new SemiCircleLineStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += updateValue(this.scale, this.dir, 1, circles)
        if (Math.abs(this.scale = this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class SCLNode {

    prev : SCLNode
    next : SCLNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new SCLNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        drawSCLNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : SCLNode {
        var curr : SCLNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class SemiCircleLine {

    root : SCLNode = new SCLNode(0)
    curr : SCLNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}
