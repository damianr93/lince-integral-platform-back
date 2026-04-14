import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  // TODO-1 [FÁCIL]: Bug de validación — contraseña mínima inconsistente.
  //
  // El problema: este DTO acepta contraseñas de 6 caracteres, pero cuando se
  // CREA un usuario (create-user.dto.ts) se exige un mínimo de 8 caracteres.
  // Eso significa que un usuario cuya contraseña tenga 6 o 7 caracteres jamás
  // podrá loguearse, porque el sistema no lo dejaría crearla en primer lugar.
  // Es una inconsistencia silenciosa que puede confundir mucho.
  //
  // La solución es simple: alinear el mínimo con el de create-user.dto.ts.
  // Ejemplo de cómo debería quedar:
  //
  //   @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  //
  // Cambiá el 6 por 8 y actualizá el mensaje. Después buscá en todo el proyecto
  // si hay algún otro DTO que valide passwords (pista: reset-password.dto.ts,
  // change-password.dto.ts) y asegurate de que todos usen el mismo mínimo.
  @IsString()
  @MinLength(6, { message: 'Contraseña demasiado corta' })
  password: string;
}
