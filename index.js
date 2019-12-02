const _ = require('lodash')

//Decision Tree
class Node {
  constructor(parent = null, turn = 0, a, b, choice = [],level,choiceHistory) {
    // if (choice.length) console.log(level+": "+(turn ? 'a' : 'b') + ' choose ' + choice.join(' '))

    this.parent = parent
    this.minmax = 0
    this.turn = turn
    this.nexts = []
    this.a = a
    this.b = b
    this.player = turn ? b : a
    this.acards = a.cards
    this.bcards = b.cards
    this.choice = choice
    this.end = 0

    if (!turn && !this.bcards.length) {
      console.log('B wins: '+choiceHistory.join(','))
      this.update(0)
    }

    if (turn && !this.acards.length) {
      console.log('A wins: '+choiceHistory.join(','))
      this.update(1)
    }
  }

  add(node) {
    this.nexts.push(node)
    return node
  }

  update(value) {
    this.end = 1
    let cur = this.parent
    while (cur != null) {
      cur.minmax = cur.turn ? cur.minmax & value : cur.minmax | value
      cur = cur.parent
    }
  }
}

const isPokerMatch = (sample, b) => {
  if (!sample || !sample.length) return true
  let lens = sample.length, lenb = b.length
  let allSameS = new Set(sample).size == 1, allSameB = new Set(b).size == 1
  let firstMatch = b[0] > sample[0]

  //16+17
  if (lenb == 2 && b[0] + b[1] == 33) return true

  //bomb
  if (lenb == 4 && allSameB) {
    return !(lens == 4 && allSameS && !firstMatch)
  }

  //1 or 2 or 3
  if (lens < 4) {
    return lenb == lens && firstMatch
  }

  if (lens == 4) {
    if (allSameS) {//4
      return lenb == 4 && allSameB && firstMatch
    } else {//3+1
      return lenb == 4 && !allSameB && firstMatch
    }
  }

  //3+2
  if (lens == 5 && new Set(sample).size == 2) {
    return new Set(b).size == 2 && firstMatch
  }

  //12345..
  return lenb == lens && firstMatch
}

class Player {
  constructor(cards = []) {
    this.cards = cards
    this.cards = this.cards.sort((a, b) => a - b)
  }

  choices(choice = null) {
    let consecs = [], ones = [], twos = [], threes = [],
      consec = [], sameCount = 1, kings = [], bombs = []

    for (let i = 0; i < this.cards.length; i++) {
      let cur = this.cards[i]
      let last = _.last(consec)

      ones.push([cur])

      if (!last || (last == cur - 1 && cur < 15)) {
        consec.push(cur)

        if (cur == 17 && last==16) kings.push([17, 16])

      } else if (last != cur) {
        sameCount = 1
        if (consec.length > 4) {
          for (let j = 0; j < consec.length - 4; j++)
            for (let k = j + 5; k <= consec.length; k++)
              consecs.push(_.slice(consec, j, k))
        }

        consec = [cur]
      } else {
        sameCount++
        twos.push([cur, cur])
        if (sameCount == 3) threes.push([cur, cur, cur])
        if (sameCount == 4) bombs.push([cur, cur, cur, cur])
      }
    }

    let threeOnes = [], threeTwos = []

    for (let i = 0; i < threes.length; i++) {
      for (let j = 0; j < this.cards.length; j++) {
        if (this.cards[j] != threes[i][0]) {
          threeOnes.push(_.concat(threes[i], [this.cards[j]]))
        }
      }

      for (let j = 0; j < twos.length; j++) {
        if (twos[j][0] != threes[i][0]) {
          threeTwos.push(_.concat(threes[i], twos[j]))
        }
      }
    }

    let all = [consecs, ones, twos, threes, kings, bombs, threeOnes, threeTwos]
      .reduce((p, c) => _.concat(p, _.uniqBy(c, JSON.stringify)), [])
      .filter(isPokerMatch.bind(this, choice))

    //no choice is a choice
    return all.length?all:[[]]
  }

  remove(choice) {
    for (let i of choice) {
      let k = 0
      while (k < this.cards.length) {
        if (k < this.cards.length && this.cards[k] == i) {
          this.cards.splice(k, 1)
          break
        }
        k++
      }
    }
  }

  update(choice) {
    // this.cards.splice(0)
    for (let i of choice) this.cards.push(i)
  }
}

let astr = '3 4 4 6 6 8 8 17', bstr = '7 9 9'

let a = new Player(astr.split(' ').map(Number)), b = new Player(bstr.split(' ').map(Number))

let root = new Node(null, 0, a, b)

const buildTree = (node = null, level, choiceHistory) => {
  if (node.end) return
  for (let choice of node.player.choices(node.choice)) {
    let stashed = [...choice]
    node.player.remove(choice)
    choiceHistory.push(stashed)
    let child = node.add(new Node(node, 1 - node.turn, node.a, node.b, stashed, level, choiceHistory))
    buildTree(child, level + 1,choiceHistory)
    choiceHistory.pop()
    node.player.update(stashed)
  }
}

buildTree(root, 0, [])

console.log(root.minmax)

// class Cards {
//     constructor(num = 0, arr = []){

//     }
// }

// 3,4,5,6,7,8,9,10,11,12,13,14,15,16,17
// const build = ()=>{

// }