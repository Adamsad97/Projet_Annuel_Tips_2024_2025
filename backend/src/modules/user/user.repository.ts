import { prisma } from '../../db/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(
    email: string,
    passwordHash: string,
    username: string,
    firstname?: string,
    lastname?: string,
  ) {
    return prisma.user.create({
      data: {
        email,
        password: passwordHash,
        // Si firstname est fourni, on l'utilise, sinon on utilise username
        firstname: firstname && firstname.length > 0 ? firstname : username,
        lastname: lastname && lastname.length > 0 ? lastname : undefined,
      },
    });
  },
};
