import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { VALIDATION_MESSAGES } from '../constants/exception-messages';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(VALIDATION_MESSAGES.INVALID_UUID);
    }

    return value;
  }
}
