/**
 * Utilitaires pour la gestion de l'année scolaire
 * Année scolaire : du 1er octobre au 30 juin
 */

export interface AcademicYear {
  startYear: number;
  endYear: number;
  label: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Obtient l'année scolaire actuelle basée sur la date du jour
 */
export function getCurrentAcademicYear(): AcademicYear {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  let startYear: number;
  let endYear: number;

  // Si nous sommes entre octobre et décembre, nous sommes dans l'année scolaire qui a commencé cette année
  if (currentMonth >= 10) {
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    // Si nous sommes entre janvier et septembre, nous sommes dans l'année scolaire qui a commencé l'année dernière
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  return {
    startYear,
    endYear,
    label: `${startYear}-${endYear}`,
    startDate: new Date(startYear, 9, 1), // 1er octobre
    endDate: new Date(endYear, 5, 30), // 30 juin
  };
}

/**
 * Vérifie si une date est dans l'année scolaire donnée
 */
export function isDateInAcademicYear(date: Date, academicYear: AcademicYear): boolean {
  return date >= academicYear.startDate && date <= academicYear.endDate;
}

/**
 * Obtient l'année scolaire pour une date donnée
 */
export function getAcademicYearForDate(date: Date): AcademicYear {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  let startYear: number;
  let endYear: number;

  if (month >= 10) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }

  return {
    startYear,
    endYear,
    label: `${startYear}-${endYear}`,
    startDate: new Date(startYear, 9, 1),
    endDate: new Date(endYear, 5, 30),
  };
}

/**
 * Calcule le nombre de mois de scolarité restants dans l'année scolaire
 */
export function getRemainingMonthsInAcademicYear(academicYear: AcademicYear): number {
  const now = new Date();
  const endDate = academicYear.endDate;
  
  if (now > endDate) return 0;
  
  const startDate = now > academicYear.startDate ? now : academicYear.startDate;
  const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
  
  return Math.max(0, monthsDiff + 1); // +1 pour inclure le mois de fin
}

/**
 * Vérifie si l'année scolaire est en cours
 */
export function isAcademicYearActive(academicYear: AcademicYear): boolean {
  const now = new Date();
  return now >= academicYear.startDate && now <= academicYear.endDate;
}
