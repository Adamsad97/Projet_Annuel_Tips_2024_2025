import { prisma } from '../../db/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        moderator: true,
        admin: true,
      },
    });
  },

  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        moderator: true,
        admin: true,
      },
    });
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
        username,
        email,
        password: passwordHash,
        firstname: firstname && firstname.length > 0 ? firstname : username,
        lastname: lastname && lastname.length > 0 ? lastname : undefined,
      },
    });
  },
};
