import { setSeederFactory } from 'typeorm-extension';
import { Contact } from '../../modules/contact/entities/contact.entity';

export default setSeederFactory(Contact, (faker) => {
  const contact = new Contact();
  contact.name = faker.person.fullName();
  contact.email = faker.internet.email();
  contact.phone =
    faker.helpers.maybe(() => faker.phone.number(), {
      probability: 0.6,
    }) ?? null;
  contact.description = faker.lorem.paragraph();
  return contact;
});
