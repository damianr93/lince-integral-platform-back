import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Satisfaction } from './schemas/satisfaction.schema';
import { CreateSatisfactionDto } from './dto/create-satisfaction.dto';
import { UpdateSatisfactionDto } from './dto/update-satisfaction.dto';

@Injectable()
export class SatisfactionService {
  constructor(
    @InjectModel('Satisfaction') private readonly satisfactionModel: Model<Satisfaction>,
  ) {}

  async create(createSatisfactionDto: CreateSatisfactionDto) {
    try {
      const createdSatisfaction = await this.satisfactionModel.create(createSatisfactionDto);
      if (!createdSatisfaction) {
        throw new BadRequestException('Error al cargar la respuesta de satisfacción');
      }
      return createdSatisfaction;
    } catch (error) {
      throw new InternalServerErrorException('Error al cargar la respuesta de satisfacción');
    }
  }

  async findAll(): Promise<Satisfaction[]> {
    try {
      return await this.satisfactionModel.find().lean().sort({ createdAt: -1 }) as Satisfaction[];
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las respuestas de satisfacción');
    }
  }

  async findOne(id: string): Promise<Satisfaction> {
    let satisfaction: Satisfaction | null;
    try {
      satisfaction = await this.satisfactionModel.findById(id).lean() as Satisfaction | null;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener la respuesta de satisfacción');
    }
    if (!satisfaction) throw new NotFoundException('Respuesta de satisfacción no encontrada');
    return satisfaction;
  }

  async update(id: string, updateSatisfactionDto: UpdateSatisfactionDto): Promise<Satisfaction | any> {
    try {
      const updatedSatisfaction = await this.satisfactionModel
        .findByIdAndUpdate(id, updateSatisfactionDto, { new: true })
        .lean();
      if (!updatedSatisfaction) {
        throw new NotFoundException('Respuesta de satisfacción no encontrada');
      }
      return updatedSatisfaction;
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar la respuesta de satisfacción');
    }
  }

  async remove(id: string) {
    try {
      const deletedSatisfaction = await this.satisfactionModel.findByIdAndDelete(id);
      if (!deletedSatisfaction) {
        throw new NotFoundException('Respuesta de satisfacción no encontrada');
      }
      return { message: 'Respuesta de satisfacción eliminada correctamente' };
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar la respuesta de satisfacción');
    }
  }
}
