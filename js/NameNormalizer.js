/**
 * Települési önkormányzat nevek normalizálása és összehasonlítása
 */

class NameNormalizer {
  constructor() {
    // Önkormányzat típusok és szinonimáik
    this.municipalityTypes = {
      'önkormányzat': ['önkormányzat', 'onkormanyzat', 'önkormányzata', 'onkormanyzata'],
      'község': ['község', 'kozseg', 'községi', 'kozsegi'],
      'nagyközség': ['nagyközség', 'nagykozseg', 'nagyközségi', 'nagykozsegi'],
      'település': ['település', 'telepules', 'települési', 'telepulesi'],
      'város': ['város', 'varos', 'városi', 'varosi'],
      'megye': ['megye', 'megyei'],
      'vármegye': ['vármegye', 'varmegye', 'vármegyei', 'varmegyei'],  
      'megyei jogú': ['jogú', 'jogu'],
      'főváros': ['főváros', 'fovaros', 'fővárosi', 'fovarosi'],
      'kerület': ['kerület', 'kerulet', 'kerületi', 'keruleti']
    };

    // Magyar ékezetek normalizálása
    this.accentMap = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o',
      'ú': 'u', 'ü': 'u', 'ű': 'u',
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ö': 'O', 'Ő': 'O',
      'Ú': 'U', 'Ü': 'U', 'Ű': 'U'
    };
  }

  /**
   * Ékezetek eltávolítása
   */
  removeAccents(text) {
    return text.split('').map(char => this.accentMap[char] || char).join('');
  }

  /**
   * Szöveg normalizálása
   */
  normalize(text) {
    return this.removeAccents(text)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      // Római számok után pont megőrzése (I-XX. közötti számok)
      .replace(/\b([ivxlcdm]+)\./gi, '$1.')
      // Egyéb pontok és kötőjelek eltávolítása, kivéve római számok után
      .replace(/(?<![ivxlcdm])[-.]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Település nevének parsolása
   */
  parse(name) {
    const normalized = this.normalize(name);
    const parts = normalized.split(' ').filter(p => p.length > 0);
    
    // Eredeti szöveg részek (ékezetekkel)
    const originalNormalized = name.toLowerCase().trim()
      .replace(/\s+/g, ' ')
      // Római számok után pont megőrzése
      .replace(/\b([ivxlcdm]+)\./gi, '$1.')
      // Egyéb pontok és kötőjelek eltávolítása, kivéve római számok után
      .replace(/(?<![ivxlcdm])[-.]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const originalParts = originalNormalized.split(' ').filter(p => p.length > 0);
    
    let settlementName = [...parts];
    let originalSettlementName = [...originalParts];
    let municipalityTypes = [];
    let removedIndices = [];
    let foundTypes = new Set(); // Típus deduplikálásra

    // Típusok keresése (több típus is lehet)
    for (const [type, variants] of Object.entries(this.municipalityTypes)) {
      for (const variant of variants) {
        const normalizedVariant = this.normalize(variant);
        const index = parts.indexOf(normalizedVariant);
        
        if (index !== -1 && !removedIndices.includes(index) && !foundTypes.has(type)) {
          municipalityTypes.push(type);
          foundTypes.add(type);
          // Csak akkor távolítjuk el, ha NEM kerület típus
          if (type !== 'kerület') {
            removedIndices.push(index);
          }
        }
      }
    }

    // Település neve az önkormányzat típusok nélkül (kerület kivételével)
    if (removedIndices.length > 0) {
      settlementName = parts.filter((_, i) => !removedIndices.includes(i));
      originalSettlementName = originalParts.filter((_, i) => !removedIndices.includes(i));
    }

    return {
      original: name,
      normalized: settlementName.join(' '),
      normalizedWithAccents: originalSettlementName.join(' '), // Ékezetes forma
      type: municipalityTypes.length === 1 ? municipalityTypes[0] : municipalityTypes,
      types: municipalityTypes,
      fullNormalized: normalized
    };
  }

  /**
   * Két településnév összehasonlítása
   */
  areEqual(name1, name2) {
    const parsed1 = this.parse(name1);
    const parsed2 = this.parse(name2);

    // Település nevek egyezése
    return parsed1.normalized === parsed2.normalized;
  }

  /**
   * Pontosabb összehasonlítás ékezetes formával
   */
  areEqualWithAccents(name1, name2) {
    const parsed1 = this.parse(name1);
    const parsed2 = this.parse(name2);

    // Először a normalizált (ékezet nélküli) formát hasonlítjuk össze
    if (parsed1.normalized !== parsed2.normalized) {
      return false;
    }

    // Ha a normalizált formák egyeznek, akkor az ékezetes formát is
    return parsed1.normalizedWithAccents === parsed2.normalizedWithAccents;
  }

  /**
   * Intelligens egyezés - ha normalizált formák egyeznek, de ékezetes formák nem,
   * akkor hasonlóság alapján dönt
   */
  smartMatch(name1, name2, threshold = 0.95) {
    const parsed1 = this.parse(name1);
    const parsed2 = this.parse(name2);

    // Ha normalizált formák nem egyeznek, nincs egyezés
    if (parsed1.normalized !== parsed2.normalized) {
      return false;
    }

    // Ha normalizált formák egyeznek, de ékezetes formák nem
    if (parsed1.normalizedWithAccents !== parsed2.normalizedWithAccents) {
      // Karakter különbségek számolása
      const accentedDiff = this.countAccentDifferences(parsed1.normalizedWithAccents, parsed2.normalizedWithAccents);
      const maxLength = Math.max(parsed1.normalizedWithAccents.length, parsed2.normalizedWithAccents.length);
      
      // Ha csak ékezetek különböznek (pl. Komoró vs Kömörő), akkor nem egyezés
      if (accentedDiff.onlyAccentDifference && accentedDiff.differentChars > 0) {
        return false;
      }
      
      const similarity = this.similarity(parsed1.normalizedWithAccents, parsed2.normalizedWithAccents);
      return similarity >= threshold;
    }

    return true;
  }

  /**
   * Ékezetes különbségek elemzése
   */
  countAccentDifferences(str1, str2) {
    const norm1 = this.removeAccents(str1);
    const norm2 = this.removeAccents(str2);
    
    // Ha ékezetek nélkül egyeznek, akkor csak ékezet különbség van
    const onlyAccentDifference = norm1 === norm2;
    
    let differentChars = 0;
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] !== str2[i]) {
        differentChars++;
      }
    }
    
    // Hossz különbség is számít
    differentChars += Math.abs(str1.length - str2.length);
    
    return {
      onlyAccentDifference,
      differentChars,
      totalChars: Math.max(str1.length, str2.length)
    };
  }

  /**
   * Hasonlóság számítása (Levenshtein távolság alapján)
   */
  similarity(name1, name2) {
    const parsed1 = this.parse(name1);
    const parsed2 = this.parse(name2);

    const s1 = parsed1.normalized;
    const s2 = parsed2.normalized;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    
    return maxLen === 0 ? 1 : 1 - (distance / maxLen);
  }

  /**
   * Levenshtein távolság számítása
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
// module.exports = MunicipalityNameNormalizer;