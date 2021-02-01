import { GAME_LOOP_DELAY_IN_MILISECONDS } from '../../constants'
import { Game } from '../../game'
import { Resource } from '../types'

export class Building {
  protected level = 0

  isBuilding = false
  remainingTimeToBuild = this.timeToBuildInMiliseconds

  constructor(
    protected game: Game,
    protected resourcesNeededToBuild: Resource[],
    public timeToBuildInMiliseconds: number,
    protected maxLevel: number
  ) {}

  getLevel() {
    return this.level
  }

  getResourcesNeededToBuild() {
    return this.resourcesNeededToBuild
  }

  getTitle() {
    return ''
  }

  getDescription() {
    return ''
  }

  startBuilding() {
    if (!this.canUpgarde() || this.isBuilding) {
      return
    }

    if (this.game.hasAvailableResources(this.resourcesNeededToBuild)) {
      this.isBuilding = true

      this.game.handleStartingConstructionOfBuilding(this)
    }
  }

  canUpgarde() {
    return this.level + 1 <= this.maxLevel
  }

  update() {
    if (this.isBuilding) {
      console.log(`${this} is building`)
      this.remainingTimeToBuild -= GAME_LOOP_DELAY_IN_MILISECONDS

      if (this.remainingTimeToBuild <= 0) {
        this.isBuilding = false
        this.level++
        this.remainingTimeToBuild = this.timeToBuildInMiliseconds

        this.game.handleBuildingWasBuilt(this)
        this.handleBuildingWasBuilt()
      }
    }
  }

  protected handleBuildingWasBuilt() {}

  render() {}

  toString = (): string => {
    return `Building: [level = ${this.level}]`
  }
}
