import { Game } from '../../game'
import { ResourceType } from '../types'
import { Building } from './building'

const GOLD = 1
const WOOD = 1
const STONE = 3
const DEFAULT_TIME_TO_BUILD = 150 * 1000
const MAX_LEVEL = 3
const DEFENCE: number[] = [0, 10, 15, 20]

export class Wall extends Building {
  private defence = DEFENCE

  constructor(game: Game) {
    super(
      game,
      [
        {
          type: ResourceType.Gold,
          count: GOLD,
        },
        {
          type: ResourceType.Wood,
          count: WOOD,
        },
        {
          type: ResourceType.Stone,
          count: STONE,
        },
      ],
      DEFAULT_TIME_TO_BUILD,
      MAX_LEVEL
    )
  }

  getDefence() {
    return this.defence[this.level]
  }

  getTitle() {
    return 'Wall'
  }

  getDescription() {
    return 'Esse officia eu Lorem excepteur aliqua non. Dolor quis nisi irure eiusmod et magna eiusmod mollit non qui ad laborum nulla.'
  }

  toString = (): string => {
    return `Wall: [level = ${this.level}]`
  }
}
