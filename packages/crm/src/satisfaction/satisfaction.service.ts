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

  // TODO-7 [DIFÍCIL]: Este servicio tiene bugs serios en el manejo de errores.
  //
  // Hay DOS problemas distintos que tenés que identificar y corregir:
  //
  // PROBLEMA A — findAll():
  //   El try/catch envuelve TODO el método. Si adentro se lanza un
  //   NotFoundException (lista vacía) o un BadRequestException, el catch
  //   los atrapa y los convierte en InternalServerErrorException.
  //   Resultado: "no hay registros" se reporta como error 500 del servidor,
  //   que es mentira — el servidor funcionó bien, simplemente no hay datos.
  //   Además, una lista vacía [] es una respuesta válida, no un error.
  //   Pregunta clave: ¿cuándo debería este método tirar error, y cuándo
  //   simplemente devolver un array vacío?
  //
  // PROBLEMA B — findOne():
  //   Mismo patrón: si findById() no encuentra el documento y lanzás
  //   NotFoundException dentro del try, el catch lo convierte en 500.
  //   El cliente nunca recibe un 404 real.
  //
  // Tu tarea: refactorizá ambos métodos para que:
  //   - Los errores reales del servidor (fallo de DB) se reporten como 500.
  //   - "No encontrado" se reporte como 404.
  //   - Una lista vacía devuelva [] sin tirar ningún error.
  //   - El tipo de retorno no use `any` — usá el tipo correcto.
  //
  // Pista: en lugar de un try/catch que envuelve todo, pensá en cuándo
  // necesitás realmente el catch y qué hacer dentro de él.
  async findAll(): Promise<Satisfaction[] | any[]> {
    try {
      const satisfactions = await this.satisfactionModel.find().lean().sort({ createdAt: -1 });
      if (!satisfactions) {
        throw new BadRequestException('Error al obtener las respuestas de satisfacción');
      }
      if (satisfactions.length === 0) {
        throw new NotFoundException('No se encontraron respuestas de satisfacción');
      }
      return satisfactions;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las respuestas de satisfacción');
    }
  }

  async findOne(id: string): Promise<Satisfaction | any> {
    try {
      const satisfaction = await this.satisfactionModel.findById(id).lean();
      if (!satisfaction) throw new NotFoundException('Respuesta de satisfacción no encontrada');
      return satisfaction;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener la respuesta de satisfacción');
    }
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
