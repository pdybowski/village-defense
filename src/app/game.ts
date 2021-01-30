import {
  DEFAULT_GOLD,
  DEFAULT_STONE,
  DEFAULT_STORAGE_CAPACITY,
  DEFAULT_WOOD,
  EASY_ATTACK_COUNTDOWN_IN_SECONDS,
  HARD_ATTACK_COUNTDOWN_IN_SECONDS,
  MEDIUM_ATTACK_COUNTDOWN_IN_SECONDS,
  ONE_SECOND,
  START_POPULATION,
} from './constants'
import {
  Building,
  Unit,
  House,
  Wall,
  Warehouse,
  Goblin,
  Knight,
  Goldmine,
  Difficulty,
  ResourceType,
  Resource,
  Fractions,
} from './models'

import { randomBetween } from './utils'

export class Game {
  private resources: Resource[] = [
    {
      type: ResourceType.Gold,
      count: DEFAULT_GOLD,
    },
    {
      type: ResourceType.Wood,
      count: DEFAULT_WOOD,
    },
    {
      type: ResourceType.Stone,
      count: DEFAULT_STONE,
    },
  ]

  private storageCapacity = DEFAULT_STORAGE_CAPACITY // max amount of resources we can store
  private villageDefence = 0 // some buildings, e.g. wall, can increase defence

  private buildings: Building[] = []
  private villageUnits: Unit[] = []

  private population = START_POPULATION

  private gameTimeInSeconds = 0
  private nextAttackCountdownInSeconds = this.calculateNextAttack()

  private intervalId?: number

  constructor(
    private fraction: Fractions = Fractions.Humans,
    private difficulty: Difficulty = Difficulty.Medium
  ) {
    // TODO: remove after testing
    // this.addVillageUnit(new Knight())
    // const wall = new Wall(this)
    // setTimeout(() => wall.startBuilding(), 20000)
    // this.addBuilding(wall)
  }

  start() {
    this.intervalId = window.setInterval(() => this.update(), ONE_SECOND)
  }

  stop() {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId!)
    }
  }

  addBuilding(building: Building) {
    this.buildings.push(building)
    building.startBuilding()
  }

  addVillageUnit(unit: Unit) {
    this.villageUnits.push(unit)
  }

  hasAvailableResources(resources: Resource[]) {
    let hasEnoughResources = true

    resources.forEach((res) => {
      const villageResource = this.getResourceForType(res.type)

      if (villageResource) {
        if (villageResource.count < res.count) {
          hasEnoughResources = false
        }
      } else {
        hasEnoughResources = false
      }
    })
    console.log('has villable available resources', hasEnoughResources)
    return hasEnoughResources
  }

  handleStartingConstructionOfBuilding(building: Building) {
    console.log('resources before building', this.getAllResourcesCount())
    this.updateResources(building.getResourcesNeededToBuild())
    console.log('resources after building started', this.getAllResourcesCount())
  }

  handleBuildingWasBuilt(building: Building) {
    console.log('New building was built', building)
    if (building instanceof House) {
      this.handleHouseWasBuilt(building as House)
    } else if (building instanceof Wall) {
      this.handlewWallWasBuilt(building as Wall)
    } else if (building instanceof Warehouse) {
      this.handleWarehouseWasBuilt(building as Warehouse)
    } else if (building instanceof Goldmine) {
      this.handleGoldmineWasBuilt(building as Goldmine)
    }
  }

  private getResourceForType(resourceType: ResourceType) {
    return this.resources.find((res) => res.type === resourceType)
  }

  private updateResources(resources: Resource[]) {
    resources.forEach((res) => {
      const villageResource = this.getResourceForType(res.type)

      if (villageResource) {
        villageResource.count -= res.count
      }
    })
  }

  private handleHouseWasBuilt(house: House) {
    this.population += house.population
  }

  private handlewWallWasBuilt(wall: Wall) {
    this.villageDefence += wall.defense
  }

  private handleWarehouseWasBuilt(warehouse: Warehouse) {
    this.storageCapacity += warehouse.capacity
  }

  private handleGoldmineWasBuilt(goldmine: Goldmine) {
    const gold = this.getResourceForType(ResourceType.Gold)

    if (gold) {
      gold.count += goldmine.goldProduction
    }
  }

  private getWarehouse(): Warehouse | undefined {
    return this.buildings.find(
      (building) => building instanceof Warehouse
    ) as Warehouse
  }

  private getWall(): Wall | undefined {
    return this.buildings.find((building) => building instanceof Wall) as Wall
  }

  private getAllResourcesCount() {
    return this.resources.reduce((prev, resource) => {
      return prev + resource.count
    }, 0)
  }

  private getListOfAvailableResources() {
    return this.resources.filter((resource) => resource.count > 0)
  }

  private update() {
    console.log('Updating game')
    console.log('game time', this.gameTimeInSeconds)
    console.log('next attak', this.nextAttackCountdownInSeconds)
    this.gameTimeInSeconds++
    this.nextAttackCountdownInSeconds--

    this.updateBuildings()
    this.renderBuildings()
    this.renderUnits()

    if (this.nextAttackCountdownInSeconds <= 0) {
      this.nextAttackCountdownInSeconds = this.calculateNextAttack()
      this.handleAttack()
    }
  }

  private renderBuildings() {
    this.buildings.forEach((building) => building.render())
  }

  private updateBuildings() {
    this.buildings.forEach((building) => building.update())
  }

  private renderUnits() {
    this.villageUnits.forEach((unit) => unit.render())
  }

  private handleAttack() {
    console.log('Attack')
    const enemies = this.getEnemies()

    if (!this.isVillageDefended(enemies)) {
      console.log('population', this.population)
      this.reducePopulation(enemies)
      console.log('population after reduction', this.population)
      console.log('all resources count', this.getAllResourcesCount())
      this.stealResources(enemies)
    }
  }

  private reducePopulation(enemies: Unit[]) {
    this.population -= Math.round(enemies.length * 0.8)

    if (this.population < 0) {
      this.population = 0
    }
  }

  private stealResources(enemies: Unit[]) {
    const warehouse = this.getWarehouse()
    const percent =
      warehouse !== undefined ? warehouse.percentOfProtectedResources() : 0
    const allResourcesCount = this.getAllResourcesCount()
    const enemiesCapacity = this.getUnitsCapacity(enemies) // how many resources can enemies carry
    let numberOfResourcesToSteal = Math.round(
      allResourcesCount - percent * allResourcesCount
    )
    console.log('percent of protected resources', percent)
    console.log('enemies capacity', enemiesCapacity)
    console.log('all resources count', allResourcesCount)

    if (enemiesCapacity < numberOfResourcesToSteal) {
      numberOfResourcesToSteal = enemiesCapacity
    }
    console.log('resources to steal', numberOfResourcesToSteal)
    const availableResources = this.getListOfAvailableResources()

    while (numberOfResourcesToSteal > 0) {
      availableResources.forEach((resource) => {
        if (resource.count > 0 && numberOfResourcesToSteal > 0) {
          resource.count--
          numberOfResourcesToSteal--
        }
      })
    }
    console.log('resources after stealing', this.getAllResourcesCount())
  }

  private getEnemies(): Unit[] {
    const wall = this.getWall()
    let maxEnemiesCount = this.villageUnits.length

    if (maxEnemiesCount === 0) {
      // there is no village units, so add some enemies
      maxEnemiesCount = 3
    }

    if (wall) {
      maxEnemiesCount += Math.round((wall.getLevel() * wall.defense) / 10)
    }

    switch (this.difficulty) {
      case Difficulty.Easy:
        maxEnemiesCount += Math.round(maxEnemiesCount * 1.2)

        break
      case Difficulty.Medium:
        maxEnemiesCount += Math.round(maxEnemiesCount * 1.8)

        break
      case Difficulty.Hard:
        maxEnemiesCount += Math.round(maxEnemiesCount * 2)

        break
    }

    const numberOfEnemies = randomBetween(1, maxEnemiesCount)
    console.log('enemies', numberOfEnemies)
    return [...Array(numberOfEnemies)].map(() => new Goblin())
  }

  private isVillageDefended(enemies: Unit[]) {
    const villageDefence = this.getVillageDefence()
    const enemiesAttack = this.getUnitsAttack(enemies)
    console.log('village defence', villageDefence)
    console.log('enemies attack', enemiesAttack)
    console.log('village defended', (villageDefence - enemiesAttack) / 10 > 0)
    return (villageDefence - enemiesAttack) / 10 > 0
  }

  private getVillageDefence() {
    return this.getUnitsDefence(this.villageUnits) + this.villageDefence
  }

  private getUnitsDefence(units: Unit[]) {
    return units.reduce((defence, unit) => {
      return defence + unit.defence
    }, 0)
  }

  private getUnitsAttack(units: Unit[]) {
    return units.reduce((attack, unit) => {
      return attack + unit.strength
    }, 0)
  }

  private getUnitsCapacity(units: Unit[]) {
    return units.reduce((capacity, unit) => {
      return capacity + unit.capacity
    }, 0)
  }
  public getNextAttack() {
    return this.nextAttackCountdownInSeconds
  }
  private calculateNextAttack() {
    let interval = 0

    const FIRST_GAME_TIME_THRESHOLD = 2 * 60 // TODO: change to 10 after testing
    const SECOND_GAME_TIME_THRESHOLD = 15 * 60
    const THIRD_GAME_TIME_THRESHOLD = 20 * 60

    switch (this.difficulty) {
      case Difficulty.Easy:
        interval = EASY_ATTACK_COUNTDOWN_IN_SECONDS

        if (this.gameTimeInSeconds >= THIRD_GAME_TIME_THRESHOLD) {
          interval *= 0.4
        } else if (this.gameTimeInSeconds >= SECOND_GAME_TIME_THRESHOLD) {
          interval *= 0.6
        } else if (this.gameTimeInSeconds >= FIRST_GAME_TIME_THRESHOLD) {
          interval *= 0.8
        }

        break
      case Difficulty.Medium:
        interval = MEDIUM_ATTACK_COUNTDOWN_IN_SECONDS

        if (this.gameTimeInSeconds >= THIRD_GAME_TIME_THRESHOLD) {
          interval *= 0.3
        } else if (this.gameTimeInSeconds >= SECOND_GAME_TIME_THRESHOLD) {
          interval *= 0.5
        } else if (this.gameTimeInSeconds >= FIRST_GAME_TIME_THRESHOLD) {
          interval *= 0.8
        }

        break
      case Difficulty.Hard:
        interval = HARD_ATTACK_COUNTDOWN_IN_SECONDS

        if (this.gameTimeInSeconds >= THIRD_GAME_TIME_THRESHOLD) {
          interval *= 0.2
        } else if (this.gameTimeInSeconds >= SECOND_GAME_TIME_THRESHOLD) {
          interval *= 0.4
        } else if (this.gameTimeInSeconds >= FIRST_GAME_TIME_THRESHOLD) {
          interval *= 0.8
        }

        break
    }

    return interval
  }
}
