import forestKeeperFemale from '../../assets/characters/forest-keeper/reference-base-female.png';
import forestKeeperMale from '../../assets/characters/forest-keeper/reference-base-male.png';
import fieldWorkerFemale from '../../assets/characters/farmer/female.png';
import fieldWorkerMale from '../../assets/characters/farmer/male.png';
import villageApprenticeFemale from '../../assets/characters/village-scholar/female.png';
import villageApprenticeMale from '../../assets/characters/village-scholar/male.png';
import type { CharacterGender } from './character';
import type { StartingCharacterId } from './startingCharacters';

const artwork = {
  'forest-keeper': { male: forestKeeperMale, female: forestKeeperFemale },
  'field-worker': { male: fieldWorkerMale, female: fieldWorkerFemale },
  'village-apprentice': { male: villageApprenticeMale, female: villageApprenticeFemale },
} satisfies Record<StartingCharacterId, Record<CharacterGender, string>>;

export function startingCharacterArtwork(id: StartingCharacterId, gender: CharacterGender): string {
  return artwork[id][gender];
}
