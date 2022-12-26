const { 
	SlashCommandBuilder, 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	PermissionsBitField,
	ChannelType
} = require('discord.js');
const { titleCase } = require("text-case");
const moment = require("moment")

module.exports = {
	data: new SlashCommandBuilder()
  .setName('book-club')
	.setDescription('Creates a new book club!')
	.addStringOption(option =>
		option.setName('book')
			.setDescription('The book the book club is on')
			.setRequired(true))
	.addIntegerOption(option =>
		option.setName('people')
			.setDescription('How many people you want for the club')
			.setRequired(true))
	.addIntegerOption(option => 
		option.setName('hours')
			.setDescription('When, in hours, you want enrolment closed')
			.setRequired(true)),

	async execute(interaction) {
		// Get the string option
		const book = interaction.options.getString('book');
		const bookClub = book + ' Book Club ' + moment().format('MMMM Do YYYY')

		const numOfPeople = interaction.options.getInteger('people')
		const hours = interaction.options.getInteger('people')
		const author = interaction.member.user.username

		const waitTimeInSeconds = hours * 60 * 60 
		const today = new Date()
		const todayUNIX = Math.floor(today.getTime() / 1000)

		const timeExpiresAt = todayUNIX + waitTimeInSeconds

		const wikiLink = titleCase(book).replace(/\s+/g, '_');

		const embedMessage = {
			title: book,
			description: `${author} is going to run a book club on the book ${book}.`,
			fields: [
				{
					name: 'Amount of people wanted',
					value: `${numOfPeople}`
				},
				{
					name: 'Link on Wikipedia',
					value: `https://en.wikipedia.org/wiki/${wikiLink}`
				},
				{
					name: `Times out in ${hours} hours.`,
					value: `Time runs out in: <t:${timeExpiresAt}:R>`
				}
			]
		}

		const customButton = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('primary')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('👍')
			);

		await interaction.channel.send({ embeds: [embedMessage], components: [customButton]})

		interaction.guild.roles.create({ 
			name: `${bookClub}`,
			permissions: [
				PermissionsBitField.Flags.SendMessages, 
				PermissionsBitField.Flags.SendMessages
			]
		})		

		const bookClubRole = interaction.guild.roles.cache.find(r => r.name === bookClub)
		const bookClubRoleId = bookClubRole.id

		await interaction.guild.channels.create({ 
			name: `${bookClub}`,
			type: ChannelType.GuildText,
			permissionOverwrites: [
				{
					id: interaction.guild.id,
					deny: [PermissionsBitField.Flags.ViewChannel]
				},
				{
					id: bookClubRoleId,
					allow:[
						PermissionsBitField.Flags.ViewChannel, 
						PermissionsBitField.Flags.SendMessages
					]
				}
			]
		})

		const waitTimeInMilliseconds = waitTimeInSeconds * 1000

		const userById = interaction.guild.members.cache.get(interaction.user.id)

		const filter = i => {
			if (userById.roles.cache.has(bookClubRole.id) === false){
				userById.roles.add(bookClubRole.id)
				i.reply({content: `${i.user.username} has been added to the book club!`})
			} else {
				i.reply({content: `You are already added to the book club.`, ephemeral: true})
				return
			}
		}

		interaction.channel.createMessageComponentCollector({ filter, max: numOfPeople, time: waitTimeInMilliseconds})
	}
};