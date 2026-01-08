import { gradeRepository } from './grade.repository';
import { AppError } from '../../utils/appError.util';

export class GradeService {
  async getAllGrades() {
    return gradeRepository.findAll();
  }

  async getGradeById(id: number) {
    const grade = await gradeRepository.findById(id);

    if (!grade) {
      throw new AppError('grade not found', 404);
    }

    return grade;
  }

  async getGradeForXp(xp: number) {
    const grade = await gradeRepository.findByXp(xp);

    if (!grade) {
      const allGrades = await gradeRepository.findAll();
      return allGrades[0] || null;
    }

    return grade;
  }
}

export const gradeService = new GradeService();
